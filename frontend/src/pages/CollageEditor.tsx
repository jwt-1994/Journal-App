import { useState, useEffect, useRef, useCallback } from 'react';
import { message, Spin, Empty, Select, Modal, Input, Button, Tooltip, InputNumber, ColorPicker, Popover, Segmented } from 'antd';
import {
  SaveOutlined,
  FolderOpenOutlined,
  DownloadOutlined,
  UndoOutlined,
  RedoOutlined,
  DeleteOutlined,
  PictureOutlined,
  HighlightOutlined,
  BorderOutlined,
  FontSizeOutlined,
  SelectOutlined,
  PlusOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { Stage, Layer, Image as KonvaImage, Transformer, Line, Rect, Circle, Ellipse, Text } from 'react-konva';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import {
  getMaterials,
  getBackgrounds,
  getBackgroundFileUrl,
  getMaterialFileUrl,
  getCollages,
  getCollage,
  createCollage,
  updateCollage,
  deleteCollage,
  getCategories,
} from '../services/api';

// --- 类型定义 ---
type ToolType = 'select' | 'brush' | 'shape' | 'text';
type ShapeType = 'rect' | 'circle' | 'ellipse';

interface CanvasElement {
  id: string;
  type: 'image' | 'brush' | 'rect' | 'circle' | 'ellipse' | 'text';
  // 通用
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  visible: boolean;
  // 图片
  material_id?: number;
  img?: HTMLImageElement;
  width?: number;
  height?: number;
  // 画笔
  points?: number[];
  strokeColor?: string;
  strokeWidth?: number;
  tension?: number;
  // 矩形/圆形/椭圆
  fill?: string;
  stroke?: string;
  radius?: number;
  radiusX?: number;
  radiusY?: number;
  // 文字
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  align?: string;
  textFill?: string;
}

interface MaterialItem {
  id: number;
  original_name: string;
  has_removed_bg: string;
}

interface BackgroundItem {
  id: number;
  name: string;
  color: string | null;
  width: number;
  height: number;
}

interface CollageItem {
  id: number;
  name: string;
  updated_at: string;
}

// --- 工具配置 ---
const TOOLS: { key: ToolType; icon: React.ReactNode; label: string; shortcut?: string }[] = [
  { key: 'select', icon: <SelectOutlined />, label: '选择', shortcut: 'V' },
  { key: 'brush', icon: <HighlightOutlined />, label: '画笔', shortcut: 'B' },
  { key: 'shape', icon: <BorderOutlined />, label: '图形', shortcut: 'R' },
  { key: 'text', icon: <FontSizeOutlined />, label: '文字', shortcut: 'T' },
];

const SHAPE_TYPES: { key: ShapeType; label: string }[] = [
  { key: 'rect', label: '矩形' },
  { key: 'circle', label: '圆形' },
  { key: 'ellipse', label: '椭圆' },
];

const DEFAULT_CANVAS_W = 1200;
const DEFAULT_CANVAS_H = 800;

const CANVAS_PRESETS: { key: string; label: string; w: number; h: number }[] = [
  { key: 'M5', label: 'M5 系统手账', w: 1050, h: 1485 },
  { key: 'A6', label: 'A6 小本', w: 1050, h: 1485 },
  { key: 'A5', label: 'A5 大本', w: 1485, h: 2100 },
  { key: 'TN_standard', label: 'TN 标准', w: 990, h: 2100 },
  { key: 'TN_passport', label: 'TN 护照', w: 890, h: 1240 },
  { key: 'B6', label: 'B6 中型本', w: 1250, h: 1760 },
  { key: 'square', label: '方形', w: 1200, h: 1200 },
  { key: 'custom', label: '自定义', w: 0, h: 0 },
];

const BRUSH_SIZES = [2, 4, 6, 8, 12, 16];

// --- 主组件 ---
export default function CollageEditor() {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 数据
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [backgrounds, setBackgrounds] = useState<BackgroundItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // 画布
  const [canvasW, setCanvasW] = useState(DEFAULT_CANVAS_W);
  const [canvasH, setCanvasH] = useState(DEFAULT_CANVAS_H);
  const [presetKey, setPresetKey] = useState('custom');
  const [scale, setScale] = useState(1);
  const [showCanvasSetup, setShowCanvasSetup] = useState(true);

  // 背景
  const [selectedBgId, setSelectedBgId] = useState<number | null>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgPopoverOpen, setBgPopoverOpen] = useState(false);

  // 元素
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<CanvasElement[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasElement[][]>([]);

  // 工具
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [shapeType, setShapeType] = useState<ShapeType>('rect');
  const [globalColor, setGlobalColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(4);

  // 模态框
  const [materialModal, setMaterialModal] = useState(false);
  const [saveModal, setSaveModal] = useState(false);
  const [loadModal, setLoadModal] = useState(false);
  const [textInputModal, setTextInputModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textClickPos, setTextClickPos] = useState<{ x: number; y: number } | null>(null);

  // 裁剪
  const [cropModal, setCropModal] = useState(false);
  const [cropElement, setCropElement] = useState<CanvasElement | null>(null);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(100);
  const [cropH, setCropH] = useState(100);

  // 方案
  const [collageId, setCollageId] = useState<number | null>(null);
  const [collageName, setCollageName] = useState('');
  const [collageList, setCollageList] = useState<CollageItem[]>([]);

  // 右键菜单
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // 素材弹窗搜索
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialCategory, setMaterialCategory] = useState<number | undefined>();

  // 图层折叠
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);

  const uid = useRef(0);
  const genId = () => `elem_${++uid.current}_${Date.now()}`;

  // --- 数据加载 ---
  useEffect(() => {
    (async () => {
      try {
        const [matRes, bgRes, catRes] = await Promise.all([
          getMaterials({ page_size: 500 }),
          getBackgrounds(),
          getCategories(),
        ]);
        setMaterials(matRes.data.items || []);
        setBackgrounds(bgRes.data);
        setCategories(catRes.data);
      } catch { message.error('加载数据失败'); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    const bg = backgrounds.find(b => b.id === selectedBgId);
    if (bg) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = getBackgroundFileUrl(bg.id);
      img.onload = () => setBgImage(img);
    } else { setBgImage(null); }
  }, [selectedBgId, backgrounds]);

  // --- 撤销/重做 ---
  const pushUndo = useCallback((els: CanvasElement[]) => {
    setUndoStack(prev => [...prev.slice(-29), JSON.parse(JSON.stringify(els))]);
    setRedoStack([]);
  }, []);

  const saveState = useCallback(() => {
    if (elements.length > 0 || undoStack.length > 0) pushUndo(elements);
  }, [elements, pushUndo]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(elements))]);
    setElements(undoStack[undoStack.length - 1]);
    setUndoStack(prev => prev.slice(0, -1));
    setSelectedId(null);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(elements))]);
    setElements(redoStack[redoStack.length - 1]);
    setRedoStack(prev => prev.slice(0, -1));
    setSelectedId(null);
  };

  // --- 选中元素 ---
  const selectedElement = elements.find(e => e.id === selectedId) || null;

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    setContextMenu(null);

    if (activeTool === 'text') {
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      setTextClickPos({ x: pos.x, y: pos.y });
      setTextInput('');
      setTextInputModal(true);
      return;
    }

    if (activeTool === 'select') {
      if (e.target === e.target.getStage()) {
        setSelectedId(null);
      }
    }
  };

  const handleStageContextMenu = (e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const target = e.target;
    if (target !== stage) {
      const clickedId = target.id();
      if (clickedId && elements.find(el => el.id === clickedId)) {
        setSelectedId(clickedId);
        setContextMenu({ x: e.evt.clientX, y: e.evt.clientY });
        return;
      }
    }
    setSelectedId(null);
    setContextMenu(null);
  };

  // --- 画布创建 ---
  const handleCreateCanvas = () => {
    setShowCanvasSetup(false);
    setElements([]);
    setSelectedId(null);
    setUndoStack([]);
    setRedoStack([]);
  };

  // --- 素材添加 ---
  const addMaterial = (m: MaterialItem) => {
    saveState();
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = m.has_removed_bg === 'done'
      ? `${getMaterialFileUrl(m.id)}?removed=true`
      : getMaterialFileUrl(m.id);
    img.onload = () => {
      const s = Math.min(200 / img.width, 200 / img.height);
      const w = img.width * s;
      const h = img.height * s;
      const el: CanvasElement = {
        id: genId(),
        type: 'image',
        x: canvasW / 2 - w / 2,
        y: canvasH / 2 - h / 2,
        width: w,
        height: h,
        rotation: 0,
        zIndex: elements.length,
        visible: true,
        material_id: m.id,
        img,
      };
      setElements(prev => [...prev, el]);
    };
    setMaterialModal(false);
  };

  // --- 画笔 ---
  const handleBrushMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (activeTool !== 'brush') return;
    setIsDrawing(true);
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    saveState();
    const el: CanvasElement = {
      id: genId(),
      type: 'brush',
      x: 0, y: 0,
      points: [pos.x, pos.y],
      strokeColor: globalColor,
      strokeWidth: brushSize,
      tension: 0.5,
      rotation: 0,
      zIndex: elements.length,
      visible: true,
    };
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
  };

  const handleBrushMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || activeTool !== 'brush') return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    setElements(prev => {
      const last = prev[prev.length - 1];
      if (!last || last.type !== 'brush') return prev;
      const updated = { ...last, points: [...(last.points || []), pos.x, pos.y] };
      return [...prev.slice(0, -1), updated];
    });
  };

  const handleBrushMouseUp = () => {
    if (activeTool !== 'brush') return;
    setIsDrawing(false);
  };

  // --- 图形（矩形/圆形/椭圆）---
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
  const shapeIdRef = useRef<string | null>(null);

  const handleShapeMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (activeTool !== 'shape') return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    saveState();
    shapeStartRef.current = { x: pos.x, y: pos.y };
    const el: CanvasElement = {
      id: genId(),
      type: shapeType,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      radius: 0,
      radiusX: 0,
      radiusY: 0,
      rotation: 0,
      zIndex: elements.length,
      visible: true,
      fill: globalColor + '40',
      stroke: globalColor,
      strokeWidth: 2,
    };
    shapeIdRef.current = el.id;
    setElements(prev => [...prev, el]);
  };

  const handleShapeMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (activeTool !== 'shape' || !shapeStartRef.current || !shapeIdRef.current) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    const sx = shapeStartRef.current.x;
    const sy = shapeStartRef.current.y;
    const bx = Math.min(sx, pos.x);
    const by = Math.min(sy, pos.y);
    const bw = Math.abs(pos.x - sx);
    const bh = Math.abs(pos.y - sy);

    setElements(prev => prev.map(el => {
      if (el.id !== shapeIdRef.current) return el;
      if (shapeType === 'circle') {
        const r = Math.min(bw, bh) / 2;
        return { ...el, x: bx + bw / 2, y: by + bh / 2, radius: r, width: bw, height: bh };
      }
      if (shapeType === 'ellipse') {
        return { ...el, x: bx + bw / 2, y: by + bh / 2, radiusX: bw / 2, radiusY: bh / 2, width: bw, height: bh };
      }
      return { ...el, x: bx, y: by, width: bw, height: bh };
    }));
  };

  const handleShapeMouseUp = () => {
    if (activeTool !== 'shape') return;
    shapeStartRef.current = null;
    shapeIdRef.current = null;
    setActiveTool('select');
  };

  // --- 文字 ---
  const handleTextConfirm = () => {
    if (!textClickPos || !textInput.trim()) { setTextInputModal(false); return; }
    saveState();
    const el: CanvasElement = {
      id: genId(),
      type: 'text',
      x: textClickPos.x,
      y: textClickPos.y,
      text: textInput,
      fontSize: 24,
      fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
      textFill: globalColor,
      align: 'left',
      rotation: 0,
      zIndex: elements.length,
      visible: true,
    };
    setElements(prev => [...prev, el]);
    setTextInputModal(false);
    setTextClickPos(null);
    setActiveTool('select');
  };

  // --- 通用鼠标事件路由 ---
  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'brush') handleBrushMouseDown(e);
    else if (activeTool === 'shape') handleShapeMouseDown(e);
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'brush') handleBrushMouseMove(e);
    else if (activeTool === 'shape') handleShapeMouseMove(e);
  };

  const handleMouseUp = () => {
    if (activeTool === 'brush') handleBrushMouseUp();
    else if (activeTool === 'shape') handleShapeMouseUp();
  };

  // --- 拖拽/变换结束 ---
  const handleDragEnd = (id: string, e: KonvaEventObject<DragEvent>) => {
    saveState();
    setElements(prev => prev.map(el => el.id === id ? { ...el, x: e.target.x(), y: e.target.y() } : el));
  };

  const handleTransformEnd = (id: string, e: KonvaEventObject<Event>) => {
    saveState();
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    setElements(prev => prev.map(el => {
      if (el.id !== id) return el;
      if (el.type === 'image') {
        return {
          ...el,
          x: node.x(), y: node.y(),
          width: Math.max(10, (el.width || 100) * scaleX),
          height: Math.max(10, (el.height || 100) * scaleY),
          rotation: node.rotation(),
        };
      }
      if (el.type === 'circle') {
        return {
          ...el,
          x: node.x(), y: node.y(),
          radius: Math.max(2, (el.radius || 50) * Math.max(scaleX, scaleY)),
          rotation: node.rotation(),
        };
      }
      if (el.type === 'ellipse') {
        return {
          ...el,
          x: node.x(), y: node.y(),
          radiusX: Math.max(2, (el.radiusX || 50) * scaleX),
          radiusY: Math.max(2, (el.radiusY || 30) * scaleY),
          rotation: node.rotation(),
        };
      }
      if (el.type === 'text') {
        return {
          ...el,
          x: node.x(), y: node.y(),
          fontSize: Math.max(8, (el.fontSize || 24) * Math.max(scaleX, scaleY)),
          rotation: node.rotation(),
        };
      }
      return { ...el, x: node.x(), y: node.y(), rotation: node.rotation() };
    }));
  };

  // --- 选中 ---
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const stage = stageRef.current;
      const transformer = transformerRef.current;
      const selectedNode = stage.findOne('#' + selectedId);
      if (selectedNode && selectedId) {
        transformer.nodes([selectedNode]);
        transformer.getLayer()?.batchDraw();
      } else {
        transformer.nodes([]);
        transformer.getLayer()?.batchDraw();
      }
    }
  }, [selectedId, elements]);

  // --- 删除 ---
  const handleDelete = () => {
    if (!selectedId) return;
    saveState();
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
    setContextMenu(null);
  };

  // --- 图层操作 ---
  const moveLayer = (direction: 'up' | 'down') => {
    if (!selectedId) return;
    saveState();
    const idx = elements.findIndex(el => el.id === selectedId);
    if (idx < 0) return;
    if (direction === 'up' && idx >= elements.length - 1) return;
    if (direction === 'down' && idx <= 0) return;
    const newArr = [...elements];
    const swapIdx = direction === 'up' ? idx + 1 : idx - 1;
    [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
    setElements(newArr.map((el, i) => ({ ...el, zIndex: i })));
  };

  const toggleVisibility = (id: string) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, visible: !el.visible } : el));
  };

  // --- 裁剪 ---
  const openCrop = () => {
    if (!selectedElement || selectedElement.type !== 'image') return;
    setCropElement(selectedElement);
    setCropX(0);
    setCropY(0);
    setCropW(selectedElement.width || 200);
    setCropH(selectedElement.height || 200);
    setCropModal(true);
    setContextMenu(null);
  };

  const applyCrop = () => {
    if (!cropElement || !cropElement.img) return;
    saveState();
    const canvas = document.createElement('canvas');
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(cropElement.img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const newImg = new window.Image();
    newImg.src = canvas.toDataURL();
    setElements(prev => prev.map(el => {
      if (el.id !== cropElement.id) return el;
      return { ...el, img: newImg, width: cropW, height: cropH, cropX: undefined, cropY: undefined, cropW: undefined, cropH: undefined };
    }));
    setCropModal(false);
    setCropElement(null);
  };

  // --- 保存/加载 ---
  const handleSave = async () => {
    if (!collageName.trim()) { message.warning('请输入方案名称'); return; }
    const layout = elements.map(el => ({
      id: el.id,
      type: el.type,
      material_id: el.material_id,
      x: el.x, y: el.y, rotation: el.rotation, zIndex: el.zIndex, visible: el.visible,
      width: el.width, height: el.height,
      points: el.points, strokeColor: el.strokeColor, strokeWidth: el.strokeWidth,
      fill: el.fill, stroke: el.stroke,
      radius: el.radius, radiusX: el.radiusX, radiusY: el.radiusY,
      text: el.text, fontSize: el.fontSize, fontFamily: el.fontFamily, textFill: el.textFill, align: el.align,
    }));
    try {
      if (collageId) {
        await updateCollage(collageId, { name: collageName, background_id: selectedBgId || undefined, layout_data: layout });
        message.success('方案已更新');
      } else {
        const res = await createCollage({ name: collageName, background_id: selectedBgId || undefined, canvas_width: canvasW, canvas_height: canvasH, layout_data: layout });
        setCollageId(res.data.id);
        message.success('方案已保存');
      }
      setSaveModal(false);
    } catch { message.error('保存失败'); }
  };

  const handleOpenLoad = async () => {
    try {
      const res = await getCollages();
      setCollageList(res.data);
      setLoadModal(true);
    } catch { message.error('加载方案列表失败'); }
  };

  const handleLoad = async (id: number) => {
    try {
      const res = await getCollage(id);
      const d = res.data;
      setCollageId(d.id);
      setCollageName(d.name);
      setSelectedBgId(d.background_id);
      setCanvasW(d.canvas_width || DEFAULT_CANVAS_W);
      setCanvasH(d.canvas_height || DEFAULT_CANVAS_H);
      setShowCanvasSetup(false);

      const layout = d.layout_data || [];
      const newEls: CanvasElement[] = [];
      let loaded = 0;
      const total = layout.filter((l: any) => l.type === 'image').length;

      layout.forEach((l: any) => {
        if (l.type === 'image') {
          const m = materials.find(m => m.id === l.material_id);
          if (m) {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.src = m.has_removed_bg === 'done' ? `${getMaterialFileUrl(m.id)}?removed=true` : getMaterialFileUrl(m.id);
            img.onload = () => {
              newEls.push({ ...l, img, material_id: m.id });
              loaded++;
              if (loaded === total) finalize();
            };
          }
        } else {
          newEls.push(l);
          loaded++;
          if (loaded === total) finalize();
        }
      });

      const finalize = () => {
        setElements(newEls);
        setUndoStack([]);
        setRedoStack([]);
        setLoadModal(false);
        message.success('方案已加载');
      };

      if (layout.length === 0) finalize();
    } catch { message.error('加载方案失败'); }
  };

  const handleDeleteCollage = async (id: number) => {
    try {
      await deleteCollage(id);
      setCollageList(prev => prev.filter(c => c.id !== id));
      if (collageId === id) { setCollageId(null); setCollageName(''); }
      message.success('方案已删除');
    } catch { message.error('删除失败'); }
  };

  const handleNew = () => {
    setShowCanvasSetup(true);
    setElements([]);
    setCollageId(null);
    setCollageName('');
    setSelectedBgId(null);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedId(null);
  };

  // --- 导出 ---
  const handleExport = () => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `拼贴_${collageName || '未命名'}.png`;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('导出成功');
  };

  // --- 键盘 ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Delete' && selectedId) { handleDelete(); }
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); handleRedo(); }
      if (!e.ctrlKey) {
        if (e.key === 'v' || e.key === 'V') setActiveTool('select');
        if (e.key === 'b' || e.key === 'B') setActiveTool('brush');
        if (e.key === 'r' || e.key === 'R') setActiveTool('shape');
        if (e.key === 't' || e.key === 'T') setActiveTool('text');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, undoStack, redoStack]);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  // --- 缩放 ---
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setScale(prev => Math.max(0.2, Math.min(3, prev - e.deltaY * 0.001)));
    }
  };

  // --- 过滤素材 ---
  const filteredMaterials = materials.filter(m => {
    if (materialSearch && !m.original_name.toLowerCase().includes(materialSearch.toLowerCase())) return false;
    return true;
  });

  // --- 背景预览卡片网格 ---
  const renderBgCards = (compact: boolean) => (
    <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap: compact ? 6 : 8 }}>
      <div
        onClick={() => { setSelectedBgId(null); setBgPopoverOpen(false); }}
        style={{
          padding: compact ? 6 : 8,
          border: selectedBgId === null ? '2px solid #1677ff' : '1px solid #e8e8e8',
          borderRadius: compact ? 6 : 8,
          cursor: 'pointer',
          textAlign: 'center',
          background: selectedBgId === null ? '#e6f4ff' : '#fff',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ width: '100%', height: compact ? 40 : 60, background: '#fff', border: '1px dashed #d9d9d9', borderRadius: compact ? 3 : 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: compact ? 10 : 12 }}>无背景</div>
        <div style={{ fontSize: compact ? 10 : 11, marginTop: compact ? 2 : 4, color: '#999' }}>无</div>
      </div>
      {backgrounds.map(bg => (
        <div
          key={bg.id}
          onClick={() => { setSelectedBgId(bg.id); setBgPopoverOpen(false); }}
          style={{
            padding: compact ? 6 : 8,
            border: selectedBgId === bg.id ? '2px solid #1677ff' : '1px solid #e8e8e8',
            borderRadius: compact ? 6 : 8,
            cursor: 'pointer',
            textAlign: 'center',
            background: selectedBgId === bg.id ? '#e6f4ff' : '#fff',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ width: '100%', height: compact ? 40 : 60, borderRadius: compact ? 3 : 4, overflow: 'hidden', background: bg.color ? `#${bg.color}` : '#f5f5f5' }}>
            <img src={getBackgroundFileUrl(bg.id)} alt={bg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontSize: compact ? 10 : 11, marginTop: compact ? 2 : 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bg.name}</div>
        </div>
      ))}
    </div>
  );

  // --- 类型标签 ---
  const typeLabel = (type: string) => {
    const map: Record<string, string> = { image: '图片', brush: '画笔', rect: '矩形', circle: '圆形', ellipse: '椭圆', text: '文字' };
    return map[type] || type;
  };

  // --- 画布设置界面 ---
  if (showCanvasSetup) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)', background: '#f5f5f5' }}>
        <div style={{ background: '#fff', padding: 40, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.1)', width: 560, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 24 }}>新建画布</h2>
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 12, color: '#666', fontSize: 14 }}>选择画布尺寸类型</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
              {CANVAS_PRESETS.map(p => (
                <div
                  key={p.key}
                  onClick={() => {
                    setPresetKey(p.key);
                    if (p.key !== 'custom') {
                      setCanvasW(p.w);
                      setCanvasH(p.h);
                    }
                  }}
                  style={{
                    padding: '10px 12px',
                    border: presetKey === p.key ? '2px solid #1677ff' : '1px solid #e8e8e8',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: presetKey === p.key ? '#e6f4ff' : '#fff',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{p.label}</div>
                  {p.key !== 'custom' && <div style={{ fontSize: 12, color: '#999' }}>{p.w} x {p.h} px</div>}
                </div>
              ))}
            </div>
            {presetKey === 'custom' && (
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
                <div>
                  <div style={{ marginBottom: 4, color: '#999', fontSize: 12 }}>宽度</div>
                  <InputNumber min={400} max={4000} step={100} value={canvasW} onChange={v => v && setCanvasW(v)} style={{ width: 140 }} addonAfter="px" />
                </div>
                <div>
                  <div style={{ marginBottom: 4, color: '#999', fontSize: 12 }}>高度</div>
                  <InputNumber min={300} max={3000} step={100} value={canvasH} onChange={v => v && setCanvasH(v)} style={{ width: 140 }} addonAfter="px" />
                </div>
              </div>
            )}
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 8, color: '#666' }}>选择背景</div>
            <div style={{ maxHeight: 220, overflow: 'auto' }}>
              {renderBgCards(false)}
            </div>
          </div>
          <Button type="primary" size="large" onClick={handleCreateCanvas} style={{ width: 200, height: 44 }}>
            创建画布
          </Button>
        </div>
      </div>
    );
  }

  // --- 主编辑器 ---
  return (
    <Spin spinning={loading}>
      <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 顶部工具栏 */}
        <div style={{ padding: '6px 16px', background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {/* 工具 */}
          {TOOLS.map(t => (
            <Tooltip key={t.key} title={`${t.label} (${t.shortcut})`}>
              <Button
                type={activeTool === t.key ? 'primary' : 'text'}
                icon={t.icon}
                onClick={() => setActiveTool(t.key)}
                style={{ minWidth: 36 }}
              />
            </Tooltip>
          ))}

          <div style={{ width: 1, height: 24, background: '#e8e8e8', margin: '0 4px' }} />

          {/* 图形类型选择 */}
          {activeTool === 'shape' && (
            <>
              <Segmented size="small" value={shapeType} onChange={v => setShapeType(v as ShapeType)}
                options={SHAPE_TYPES.map(s => ({ value: s.key, label: s.label }))}
              />
              <div style={{ width: 1, height: 24, background: '#e8e8e8', margin: '0 4px' }} />
            </>
          )}

          {/* 全局颜色选择器 */}
          {(activeTool === 'brush' || activeTool === 'shape' || activeTool === 'text') && (
            <>
              <ColorPicker size="small" value={globalColor} onChange={(_, hex) => setGlobalColor(hex)} />
              <div style={{ width: 1, height: 24, background: '#e8e8e8', margin: '0 4px' }} />
            </>
          )}

          {/* 画笔大小 */}
          {activeTool === 'brush' && (
            <>
              <Select value={brushSize} onChange={setBrushSize} style={{ width: 70 }} size="small"
                options={BRUSH_SIZES.map(s => ({ value: s, label: `${s}px` }))}
              />
              <div style={{ width: 1, height: 24, background: '#e8e8e8', margin: '0 4px' }} />
            </>
          )}

          <div style={{ flex: 1 }} />

          {/* 添加素材按钮 */}
          <Button icon={<PlusOutlined />} onClick={() => setMaterialModal(true)}>添加素材</Button>

          <div style={{ width: 1, height: 24, background: '#e8e8e8', margin: '0 4px' }} />

          {/* 背景选择 - Popover + 卡片网格 */}
          <Popover
            content={<div style={{ width: 280 }}>{renderBgCards(true)}</div>}
            trigger="click"
            open={bgPopoverOpen}
            onOpenChange={setBgPopoverOpen}
          >
            <Button size="small" icon={<PictureOutlined />}>
              {selectedBgId ? (backgrounds.find(b => b.id === selectedBgId)?.name || '背景') : '背景'}
            </Button>
          </Popover>

          {/* 缩放 */}
          <Tooltip title="Ctrl+滚轮缩放">
            <span style={{ fontSize: 12, color: '#999', minWidth: 50, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
          </Tooltip>

          <div style={{ width: 1, height: 24, background: '#e8e8e8', margin: '0 4px' }} />

          {/* 操作按钮 */}
          <Tooltip title="撤销 (Ctrl+Z)"><Button type="text" icon={<UndoOutlined />} onClick={handleUndo} disabled={undoStack.length === 0} /></Tooltip>
          <Tooltip title="重做 (Ctrl+Y)"><Button type="text" icon={<RedoOutlined />} onClick={handleRedo} disabled={redoStack.length === 0} /></Tooltip>

          <div style={{ width: 1, height: 24, background: '#e8e8e8', margin: '0 4px' }} />

          <Button size="small" onClick={handleNew}>新建</Button>
          <Button size="small" icon={<FolderOpenOutlined />} onClick={handleOpenLoad}>加载</Button>
          <Button size="small" icon={<SaveOutlined />} type="primary" onClick={() => setSaveModal(true)}>保存</Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={handleExport} disabled={elements.length === 0}>导出</Button>
        </div>

        {/* 主体：画布 + 右侧面板 */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* 画布区域 */}
          <div
            ref={containerRef}
            onWheel={handleWheel}
            style={{ flex: 1, background: '#e0e0e0', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
              <Stage
                ref={stageRef}
                width={canvasW}
                height={canvasH}
                onClick={handleStageClick}
                onTap={handleStageClick as never}
                onContextMenu={handleStageContextMenu}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{ background: '#fff', cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
              >
                {/* 背景层 */}
                <Layer>
                  {bgImage && (
                    <KonvaImage image={bgImage} width={canvasW} height={canvasH} listening={false} />
                  )}
                </Layer>
                {/* 元素层 */}
                <Layer>
                  {elements.map(el => {
                    if (!el.visible) return null;
                    const commonProps = {
                      id: el.id,
                      x: el.x,
                      y: el.y,
                      rotation: el.rotation,
                      draggable: activeTool === 'select',
                      onClick: () => { if (activeTool === 'select') setSelectedId(el.id); },
                      onTap: () => { if (activeTool === 'select') setSelectedId(el.id); },
                      onDragEnd: (e: KonvaEventObject<DragEvent>) => handleDragEnd(el.id, e),
                      onTransformEnd: (e: KonvaEventObject<Event>) => handleTransformEnd(el.id, e),
                    };

                    if (el.type === 'image' && el.img) {
                      return (
                        <KonvaImage key={el.id} {...commonProps}
                          image={el.img}
                          width={el.width} height={el.height}
                        />
                      );
                    }
                    if (el.type === 'brush') {
                      return (
                        <Line key={el.id} {...commonProps}
                          points={el.points || []}
                          stroke={el.strokeColor}
                          strokeWidth={el.strokeWidth}
                          tension={el.tension}
                          lineCap="round"
                          lineJoin="round"
                          globalCompositeOperation="source-over"
                        />
                      );
                    }
                    if (el.type === 'rect') {
                      return (
                        <Rect key={el.id} {...commonProps}
                          width={el.width} height={el.height}
                          fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth}
                        />
                      );
                    }
                    if (el.type === 'circle') {
                      return (
                        <Circle key={el.id} {...commonProps}
                          radius={el.radius || 50}
                          fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth}
                        />
                      );
                    }
                    if (el.type === 'ellipse') {
                      return (
                        <Ellipse key={el.id} {...commonProps}
                          radiusX={el.radiusX || 50} radiusY={el.radiusY || 30}
                          fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth}
                        />
                      );
                    }
                    if (el.type === 'text') {
                      return (
                        <Text key={el.id} {...commonProps}
                          text={el.text}
                          fontSize={el.fontSize}
                          fontFamily={el.fontFamily}
                          fill={el.textFill}
                          align={el.align}
                        />
                      );
                    }
                    return null;
                  })}
                  {selectedId && (
                    <Transformer
                      ref={transformerRef}
                      boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 10 || newBox.height < 10) return oldBox;
                        return newBox;
                      }}
                    />
                  )}
                </Layer>
              </Stage>
            </div>
          </div>

          {/* 右侧属性/图层面板 */}
          <div style={{ width: 240, borderLeft: '1px solid #e8e8e8', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* 属性面板 */}
            <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0', maxHeight: '50%', overflow: 'auto' }}>
              <h4 style={{ margin: '0 0 8px' }}>属性</h4>
              {!selectedElement ? (
                <div style={{ color: '#999', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>点击元素查看属性</div>
              ) : (
                <div style={{ fontSize: 13 }}>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: '#999' }}>类型：</span>
                    {typeLabel(selectedElement.type)}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: '#999' }}>位置：</span>
                    X: {Math.round(selectedElement.x)}, Y: {Math.round(selectedElement.y)}
                  </div>
                  {selectedElement.type === 'image' && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ color: '#999' }}>尺寸：</span>
                      {Math.round(selectedElement.width || 0)} x {Math.round(selectedElement.height || 0)}
                      <div style={{ marginTop: 4 }}>
                        <Button size="small" onClick={() => { setSelectedId(null); openCrop(); }}>裁剪</Button>
                      </div>
                    </div>
                  )}
                  {(selectedElement.type === 'rect' || selectedElement.type === 'circle' || selectedElement.type === 'ellipse') && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: '#999' }}>填充：</span>
                        <ColorPicker size="small" value={selectedElement.fill || '#ffffff80'} onChange={(_, hex) =>
                          setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fill: hex } : el))
                        } />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#999' }}>描边：</span>
                        <ColorPicker size="small" value={selectedElement.stroke || '#000000'} onChange={(_, hex) =>
                          setElements(prev => prev.map(el => el.id === selectedId ? { ...el, stroke: hex } : el))
                        } />
                      </div>
                    </div>
                  )}
                  {selectedElement.type === 'text' && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ color: '#999', marginBottom: 4 }}>文字内容：</div>
                      <Input.TextArea value={selectedElement.text} onChange={e => {
                        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, text: e.target.value } : el));
                      }} rows={3} />
                      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#999' }}>字号：</span>
                        <InputNumber size="small" value={selectedElement.fontSize} min={8} max={200} style={{ width: 70 }}
                          onChange={v => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fontSize: v || 24 } : el))}
                        />
                      </div>
                      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#999' }}>颜色：</span>
                        <ColorPicker size="small" value={selectedElement.textFill} onChange={(_, hex) =>
                          setElements(prev => prev.map(el => el.id === selectedId ? { ...el, textFill: hex } : el))
                        } />
                      </div>
                    </div>
                  )}
                  {selectedElement.type === 'brush' && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#999' }}>颜色：</span>
                        <ColorPicker size="small" value={selectedElement.strokeColor || '#000000'} onChange={(_, hex) =>
                          setElements(prev => prev.map(el => el.id === selectedId ? { ...el, strokeColor: hex } : el))
                        } />
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <Button danger size="small" icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
                  </div>
                </div>
              )}
            </div>

            {/* 图层面板 */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setLayerPanelOpen(!layerPanelOpen)}>
                <h4 style={{ margin: 0 }}>图层 ({elements.length})</h4>
                {layerPanelOpen ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              </div>
              {layerPanelOpen && (
                <div style={{ flex: 1, overflow: 'auto', padding: '4px 8px' }}>
                  {elements.length === 0 ? (
                    <div style={{ color: '#999', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>暂无元素</div>
                  ) : (
                    [...elements].reverse().map((el, revIdx) => {
                      const idx = elements.length - 1 - revIdx;
                      const label = el.type === 'image' ? (materials.find(m => m.id === el.material_id)?.original_name || '图片') :
                        el.type === 'brush' ? '画笔' : el.type === 'rect' ? '矩形' : el.type === 'circle' ? '圆形' : el.type === 'ellipse' ? '椭圆' : el.text?.slice(0, 6) || '文字';
                      return (
                        <div key={el.id}
                          onClick={() => { setActiveTool('select'); setSelectedId(el.id); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 4, cursor: 'pointer',
                            background: selectedId === el.id ? '#e6f4ff' : 'transparent',
                            border: selectedId === el.id ? '1px solid #1677ff' : '1px solid transparent',
                            opacity: el.visible ? 1 : 0.4,
                            marginBottom: 2,
                          }}
                        >
                          <div style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                          <Tooltip title={el.visible ? '隐藏' : '显示'}>
                            <Button type="text" size="small" icon={el.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                              onClick={e => { e.stopPropagation(); toggleVisibility(el.id); }}
                            />
                          </Tooltip>
                          <Tooltip title="上移"><Button type="text" size="small" disabled={idx >= elements.length - 1}
                            onClick={e => { e.stopPropagation(); setSelectedId(el.id); moveLayer('up'); }}>↑</Button></Tooltip>
                          <Tooltip title="下移"><Button type="text" size="small" disabled={idx <= 0}
                            onClick={e => { e.stopPropagation(); setSelectedId(el.id); moveLayer('down'); }}>↓</Button></Tooltip>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右键菜单 */}
        {contextMenu && (
          <div style={{
            position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 1000,
            background: '#fff', border: '1px solid #e8e8e8', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: 160, padding: '4px 0',
          }}>
            <div onClick={() => { setContextMenu(null); moveLayer('up'); }} style={menuItemStyle}>上移一层</div>
            <div onClick={() => { setContextMenu(null); moveLayer('down'); }} style={menuItemStyle}>下移一层</div>
            {selectedElement?.type === 'image' && (
              <div onClick={openCrop} style={menuItemStyle}>裁剪</div>
            )}
            <div style={{ borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />
            <div onClick={handleDelete} style={{ ...menuItemStyle, color: '#ff4d4f' }}>删除</div>
          </div>
        )}

        {/* 素材库弹窗 */}
        <Modal title="选择素材" open={materialModal} onCancel={() => setMaterialModal(false)} footer={null} width={700}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Input.Search placeholder="搜索素材..." value={materialSearch} onChange={e => setMaterialSearch(e.target.value)} allowClear style={{ flex: 1 }} />
            <Select placeholder="分类" allowClear style={{ width: 140 }} value={materialCategory} onChange={setMaterialCategory}
              options={categories.map(c => ({ value: c.id, label: c.name }))} />
          </div>
          {filteredMaterials.length === 0 ? (
            <Empty description="暂无素材" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxHeight: 400, overflow: 'auto' }}>
              {filteredMaterials.map(m => (
                <div key={m.id} onClick={() => addMaterial(m)}
                  style={{ cursor: 'pointer', border: '1px solid #f0f0f0', borderRadius: 8, padding: 8, textAlign: 'center', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1677ff'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(22,119,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <img src={m.has_removed_bg === 'done' ? `${getMaterialFileUrl(m.id)}?removed=true` : getMaterialFileUrl(m.id)}
                    alt={m.original_name} style={{ width: '100%', height: 120, objectFit: 'contain', borderRadius: 4 }} />
                  <div style={{ fontSize: 12, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.original_name}</div>
                </div>
              ))}
            </div>
          )}
        </Modal>

        {/* 文字输入弹窗 */}
        <Modal title="输入文字" open={textInputModal} onOk={handleTextConfirm} onCancel={() => setTextInputModal(false)} okText="确定" cancelText="取消">
          <Input.TextArea value={textInput} onChange={e => setTextInput(e.target.value)} rows={3} placeholder="输入文字内容..." autoFocus />
        </Modal>

        {/* 裁剪弹窗 */}
        <Modal title="裁剪素材" open={cropModal} onOk={applyCrop} onCancel={() => setCropModal(false)} okText="裁剪" cancelText="取消">
          {cropElement?.img && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                <img src={cropElement.img.src} alt="" style={{ maxWidth: 400, maxHeight: 300, opacity: 0.7 }} />
                <div style={{
                  position: 'absolute', border: '2px solid #1677ff', background: 'rgba(22,119,255,0.1)',
                  left: cropX, top: cropY, width: cropW, height: cropH,
                }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><span style={{ color: '#999', fontSize: 12 }}>X 偏移</span><InputNumber size="small" value={cropX} onChange={v => setCropX(v || 0)} min={0} style={{ width: '100%' }} /></div>
                <div><span style={{ color: '#999', fontSize: 12 }}>Y 偏移</span><InputNumber size="small" value={cropY} onChange={v => setCropY(v || 0)} min={0} style={{ width: '100%' }} /></div>
                <div><span style={{ color: '#999', fontSize: 12 }}>宽度</span><InputNumber size="small" value={cropW} onChange={v => setCropW(v || 10)} min={10} style={{ width: '100%' }} /></div>
                <div><span style={{ color: '#999', fontSize: 12 }}>高度</span><InputNumber size="small" value={cropH} onChange={v => setCropH(v || 10)} min={10} style={{ width: '100%' }} /></div>
              </div>
            </div>
          )}
        </Modal>

        {/* 保存弹窗 */}
        <Modal title="保存拼贴方案" open={saveModal} onOk={handleSave} onCancel={() => setSaveModal(false)} okText="保存" cancelText="取消">
          <Input placeholder="输入方案名称" value={collageName} onChange={e => setCollageName(e.target.value)} style={{ marginTop: 16 }} />
        </Modal>

        {/* 加载弹窗 */}
        <Modal title="加载拼贴方案" open={loadModal} onCancel={() => setLoadModal(false)} footer={null} width={450}>
          {collageList.length === 0 ? (
            <Empty description="暂无已保存的方案" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {collageList.map(c => (
                <div key={c.id} onClick={() => handleLoad(c.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid #f0f0f0', borderRadius: 8, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#1677ff'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#f0f0f0'}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{new Date(c.updated_at).toLocaleString()}</div>
                  </div>
                  <Button type="text" danger icon={<DeleteOutlined />}
                    onClick={e => { e.stopPropagation(); handleDeleteCollage(c.id); }} />
                </div>
              ))}
            </div>
          )}
        </Modal>
      </div>
    </Spin>
  );
}

const menuItemStyle: React.CSSProperties = {
  padding: '6px 16px',
  cursor: 'pointer',
  fontSize: 13,
  transition: 'background 0.15s',
};