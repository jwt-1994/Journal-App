import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Toast, Popup, Segmented, ColorPicker, Slider, Input, Dialog } from 'antd-mobile';
import {
  SelectOutlined,
  HighlightOutlined,
  BorderOutlined,
  FontSizeOutlined,
  PictureOutlined,
  UndoOutlined,
  RedoOutlined,
  DeleteOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  DownloadOutlined,
  PlusOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  UnorderedListOutlined,
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
} from '../../services/api';

// --- 类型 ---
type ToolType = 'select' | 'brush' | 'shape' | 'text';
type ShapeType = 'rect' | 'circle' | 'ellipse';

interface CanvasElement {
  id: string;
  type: 'image' | 'brush' | 'rect' | 'circle' | 'ellipse' | 'text';
  x: number; y: number; rotation: number; zIndex: number; visible: boolean;
  material_id?: number; img?: HTMLImageElement; width?: number; height?: number;
  points?: number[]; strokeColor?: string; strokeWidth?: number; tension?: number;
  fill?: string; stroke?: string; radius?: number; radiusX?: number; radiusY?: number;
  text?: string; fontSize?: number; fontFamily?: string; align?: string; textFill?: string;
}

interface MaterialItem { id: number; original_name: string; has_removed_bg: string; }
interface BackgroundItem { id: number; name: string; color: string | null; width: number; height: number; }
interface CollageItem { id: number; name: string; updated_at: string; }

const TOOLS: { key: ToolType; icon: React.ReactNode; label: string }[] = [
  { key: 'select', icon: <SelectOutlined />, label: '选择' },
  { key: 'brush', icon: <HighlightOutlined />, label: '画笔' },
  { key: 'shape', icon: <BorderOutlined />, label: '图形' },
  { key: 'text', icon: <FontSizeOutlined />, label: '文字' },
];

const SHAPE_TYPES: { key: ShapeType; label: string }[] = [
  { key: 'rect', label: '矩形' },
  { key: 'circle', label: '圆形' },
  { key: 'ellipse', label: '椭圆' },
];

const CANVAS_PRESETS: { key: string; label: string; w: number; h: number }[] = [
  { key: 'M5', label: 'M5 系统手账', w: 1050, h: 1485 },
  { key: 'A6', label: 'A6 小本', w: 1050, h: 1485 },
  { key: 'A5', label: 'A5 大本', w: 1485, h: 2100 },
  { key: 'TN_standard', label: 'TN 标准', w: 990, h: 2100 },
  { key: 'TN_passport', label: 'TN 护照', w: 890, h: 1240 },
  { key: 'B6', label: 'B6 中型本', w: 1250, h: 1760 },
  { key: 'square', label: '方形', w: 1200, h: 1200 },
  { key: 'phone_9_16', label: '手机 9:16', w: 1080, h: 1920 },
  { key: 'phone_3_4', label: '手机 3:4', w: 1200, h: 1600 },
  { key: 'custom', label: '自定义', w: 0, h: 0 },
];

const BRUSH_SIZES = [2, 4, 6, 8, 12, 16];

export default function MobileCollageEditor() {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 数据
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [backgrounds, setBackgrounds] = useState<BackgroundItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // 画布
  const [canvasW, setCanvasW] = useState(1080);
  const [canvasH, setCanvasH] = useState(1920);
  const [presetKey, setPresetKey] = useState('phone_9_16');
  const [scale, setScale] = useState(1);
  const [showCanvasSetup, setShowCanvasSetup] = useState(true);

  // 背景
  const [selectedBgId, setSelectedBgId] = useState<number | null>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

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

  // 弹出面板
  const [showToolbar, setShowToolbar] = useState(true);
  const [showMaterialSheet, setShowMaterialSheet] = useState(false);
  const [showPropertiesSheet, setShowPropertiesSheet] = useState(false);
  const [showLayersSheet, setShowLayersSheet] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [showLoadSheet, setShowLoadSheet] = useState(false);
  const [showBgSheet, setShowBgSheet] = useState(false);
  const [showPresetSheet, setShowPresetSheet] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);

  const [textInput, setTextInput] = useState('');
  const [textClickPos, setTextClickPos] = useState<{ x: number; y: number } | null>(null);
  const [collageId, setCollageId] = useState<number | null>(null);
  const [collageName, setCollageName] = useState('');
  const [collageList, setCollageList] = useState<CollageItem[]>([]);
  const [materialSearch, setMaterialSearch] = useState('');

  // 手势
  const pinchRef = useRef({ dist: 0, scale: 1, lastScale: 1 });
  const panRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0, panning: false });
  const lastTapRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 画布平移位置
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // 长按菜单
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elId: string } | null>(null);

  const uid = useRef(0);
  const genId = () => `melem_${++uid.current}_${Date.now()}`;

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
      } catch { /* ignore */ }
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

  const selectedElement = elements.find(e => e.id === selectedId) || null;

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
    img.src = m.has_removed_bg === 'done' ? `${getMaterialFileUrl(m.id)}?removed=true` : getMaterialFileUrl(m.id);
    img.onload = () => {
      const s = Math.min(200 / img.width, 200 / img.height);
      const el: CanvasElement = {
        id: genId(), type: 'image',
        x: canvasW / 2 - (img.width * s) / 2,
        y: canvasH / 2 - (img.height * s) / 2,
        width: img.width * s, height: img.height * s,
        rotation: 0, zIndex: elements.length, visible: true,
        material_id: m.id, img,
      };
      setElements(prev => [...prev, el]);
    };
    setShowMaterialSheet(false);
  };

  // --- 重置缩放/平移 ---
  const resetView = () => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  };

  // --- 触控事件 ---
  const handleTouchStart = (e: KonvaEventObject<TouchEvent>) => {
    const touch = e.evt;
    setContextMenu(null);

    if (touch.touches.length === 2) {
      // 双指：捏合缩放 + 平移
      const dx = touch.touches[0].clientX - touch.touches[1].clientX;
      const dy = touch.touches[0].clientY - touch.touches[1].clientY;
      pinchRef.current.dist = Math.sqrt(dx * dx + dy * dy);
      pinchRef.current.lastScale = scale;
      // 记录双指中点作为平移起点
      panRef.current.startX = (touch.touches[0].clientX + touch.touches[1].clientX) / 2;
      panRef.current.startY = (touch.touches[0].clientY + touch.touches[1].clientY) / 2;
      panRef.current.lastX = panX;
      panRef.current.lastY = panY;
      panRef.current.panning = true;
      return;
    }

    if (touch.touches.length === 1) {
      // 双击检测（重置缩放）
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        resetView();
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      // 长按检测（上下文菜单）
      if (activeTool === 'select') {
        const stage = stageRef.current;
        if (!stage) return;
        const pos = stage.getPointerPosition();
        if (!pos) return;
        longPressTimerRef.current = setTimeout(() => {
          const stage2 = stageRef.current;
          if (!stage2) return;
          const targetEl = elements.find(el => el.id === selectedId);
          if (targetEl) {
            setContextMenu({ x: touch.touches[0].clientX, y: touch.touches[0].clientY, elId: targetEl.id });
          }
        }, 500);
      }

      if (activeTool === 'brush') handleBrushStart(e);
      else if (activeTool === 'shape') handleShapeStart(e);
      else if (activeTool === 'text') {
        const stage = stageRef.current;
        if (!stage) return;
        const pos = stage.getPointerPosition();
        if (!pos) return;
        setTextClickPos({ x: pos.x, y: pos.y });
        setTextInput('');
        setShowTextInput(true);
      }
    }
  };

  const handleTouchMove = (e: KonvaEventObject<TouchEvent>) => {
    const touch = e.evt;
    // 取消长按（手指移动了）
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (touch.touches.length === 2 && panRef.current.panning) {
      // 缩放
      const dx = touch.touches[0].clientX - touch.touches[1].clientX;
      const dy = touch.touches[0].clientY - touch.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (pinchRef.current.dist > 0) {
        const newScale = pinchRef.current.lastScale * (dist / pinchRef.current.dist);
        setScale(Math.max(0.2, Math.min(3, newScale)));
      }
      // 平移
      const midX = (touch.touches[0].clientX + touch.touches[1].clientX) / 2;
      const midY = (touch.touches[0].clientY + touch.touches[1].clientY) / 2;
      setPanX(panRef.current.lastX + (midX - panRef.current.startX));
      setPanY(panRef.current.lastY + (midY - panRef.current.startY));
      return;
    }

    if (activeTool === 'brush') handleBrushMove(e);
    else if (activeTool === 'shape') handleShapeMove(e);
  };

  const handleTouchEnd = () => {
    // 清除长按计时器
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    panRef.current.panning = false;
    if (activeTool === 'brush') { setIsDrawing(false); }
    else if (activeTool === 'shape') { shapeStartRef.current = null; shapeIdRef.current = null; setActiveTool('select'); }
  };

  // --- 画笔（触控）---
  const handleBrushStart = (e: KonvaEventObject<TouchEvent>) => {
    setIsDrawing(true);
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    saveState();
    const el: CanvasElement = {
      id: genId(), type: 'brush', x: 0, y: 0,
      points: [pos.x, pos.y], strokeColor: globalColor, strokeWidth: brushSize,
      tension: 0.5, rotation: 0, zIndex: elements.length, visible: true,
    };
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
  };

  const handleBrushMove = (e: KonvaEventObject<TouchEvent>) => {
    if (!isDrawing) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    setElements(prev => {
      const last = prev[prev.length - 1];
      if (!last || last.type !== 'brush') return prev;
      return [...prev.slice(0, -1), { ...last, points: [...(last.points || []), pos.x, pos.y] }];
    });
  };

  // --- 图形（触控）---
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
  const shapeIdRef = useRef<string | null>(null);

  const handleShapeStart = (e: KonvaEventObject<TouchEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    saveState();
    shapeStartRef.current = { x: pos.x, y: pos.y };
    const el: CanvasElement = {
      id: genId(), type: shapeType, x: pos.x, y: pos.y,
      width: 0, height: 0, radius: 0, radiusX: 0, radiusY: 0,
      rotation: 0, zIndex: elements.length, visible: true,
      fill: globalColor + '40', stroke: globalColor, strokeWidth: 2,
    };
    shapeIdRef.current = el.id;
    setElements(prev => [...prev, el]);
  };

  const handleShapeMove = (e: KonvaEventObject<TouchEvent>) => {
    if (!shapeStartRef.current || !shapeIdRef.current) return;
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

  // --- 文字 ---
  const handleTextConfirm = () => {
    if (!textClickPos || !textInput.trim()) { setShowTextInput(false); return; }
    saveState();
    const el: CanvasElement = {
      id: genId(), type: 'text', x: textClickPos.x, y: textClickPos.y,
      text: textInput, fontSize: 24, fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
      textFill: globalColor, align: 'left', rotation: 0, zIndex: elements.length, visible: true,
    };
    setElements(prev => [...prev, el]);
    setShowTextInput(false);
    setTextClickPos(null);
    setActiveTool('select');
  };

  // --- 选中/拖拽 ---
  const handleStageTap = (e: KonvaEventObject<TouchEvent>) => {
    setContextMenu(null);
    if (activeTool === 'select') {
      if (e.target === e.target.getStage()) {
        setSelectedId(null);
      }
    }
  };

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
        return { ...el, x: node.x(), y: node.y(), width: Math.max(10, (el.width || 100) * scaleX), height: Math.max(10, (el.height || 100) * scaleY), rotation: node.rotation() };
      }
      if (el.type === 'circle') {
        return { ...el, x: node.x(), y: node.y(), radius: Math.max(2, (el.radius || 50) * Math.max(scaleX, scaleY)), rotation: node.rotation() };
      }
      if (el.type === 'ellipse') {
        return { ...el, x: node.x(), y: node.y(), radiusX: Math.max(2, (el.radiusX || 50) * scaleX), radiusY: Math.max(2, (el.radiusY || 30) * scaleY), rotation: node.rotation() };
      }
      if (el.type === 'text') {
        return { ...el, x: node.x(), y: node.y(), fontSize: Math.max(8, (el.fontSize || 24) * Math.max(scaleX, scaleY)), rotation: node.rotation() };
      }
      return { ...el, x: node.x(), y: node.y(), rotation: node.rotation() };
    }));
  };

  // --- Transformer ---
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const transformer = transformerRef.current;
      const selectedNode = stageRef.current.findOne('#' + selectedId);
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

  // --- 保存/加载 ---
  const handleSave = async () => {
    if (!collageName.trim()) { Toast.show({ content: '请输入方案名称', icon: 'fail' }); return; }
    const layout = elements.map(el => ({
      id: el.id, type: el.type, material_id: el.material_id,
      x: el.x, y: el.y, rotation: el.rotation, zIndex: el.zIndex, visible: el.visible,
      width: el.width, height: el.height, points: el.points, strokeColor: el.strokeColor, strokeWidth: el.strokeWidth,
      fill: el.fill, stroke: el.stroke, radius: el.radius, radiusX: el.radiusX, radiusY: el.radiusY,
      text: el.text, fontSize: el.fontSize, fontFamily: el.fontFamily, textFill: el.textFill, align: el.align,
    }));
    try {
      if (collageId) {
        await updateCollage(collageId, { name: collageName, background_id: selectedBgId || undefined, layout_data: layout });
        Toast.show({ content: '方案已更新', icon: 'success' });
      } else {
        const res = await createCollage({ name: collageName, background_id: selectedBgId || undefined, canvas_width: canvasW, canvas_height: canvasH, layout_data: layout });
        setCollageId(res.data.id);
        Toast.show({ content: '方案已保存', icon: 'success' });
      }
      setShowSaveSheet(false);
    } catch { Toast.show({ content: '保存失败', icon: 'fail' }); }
  };

  const handleOpenLoad = async () => {
    try {
      const res = await getCollages();
      setCollageList(res.data);
      setShowLoadSheet(true);
    } catch { Toast.show({ content: '加载方案列表失败', icon: 'fail' }); }
  };

  const handleLoad = async (id: number) => {
    try {
      const res = await getCollage(id);
      const d = res.data;
      setCollageId(d.id); setCollageName(d.name); setSelectedBgId(d.background_id);
      setCanvasW(d.canvas_width || 1080); setCanvasH(d.canvas_height || 1920);
      setShowCanvasSetup(false);

      const layout = d.layout_data || [];
      if (layout.length === 0) { setElements([]); setShowLoadSheet(false); return; }

      const newEls: CanvasElement[] = [];
      let loaded = 0;
      const imgItems = layout.filter((l: any) => l.type === 'image');

      if (imgItems.length === 0) {
        setElements(layout as CanvasElement[]);
        setShowLoadSheet(false);
        return;
      }

      imgItems.forEach((l: any) => {
        const m = materials.find(m => m.id === l.material_id);
        if (m) {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.src = m.has_removed_bg === 'done' ? `${getMaterialFileUrl(m.id)}?removed=true` : getMaterialFileUrl(m.id);
          img.onload = () => { newEls.push({ ...l, img, material_id: m.id }); loaded++; if (loaded === imgItems.length) finalize(); };
        } else {
          newEls.push(l); loaded++; if (loaded === imgItems.length) finalize();
        }
      });
      const finalize = () => { setElements(newEls); setUndoStack([]); setRedoStack([]); setShowLoadSheet(false); Toast.show({ content: '方案已加载', icon: 'success' }); };
    } catch { Toast.show({ content: '加载失败', icon: 'fail' }); }
  };

  const handleDeleteCollage = async (id: number) => {
    Dialog.confirm({
      title: '确定删除此方案？',
      onConfirm: async () => {
        await deleteCollage(id);
        setCollageList(prev => prev.filter(c => c.id !== id));
        if (collageId === id) { setCollageId(null); setCollageName(''); }
        Toast.show({ content: '方案已删除', icon: 'success' });
      },
    });
  };

  const handleNew = () => {
    setShowCanvasSetup(true);
    setElements([]); setCollageId(null); setCollageName('');
    setSelectedBgId(null); setUndoStack([]); setRedoStack([]); setSelectedId(null);
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
    Toast.show({ content: '导出成功', icon: 'success' });
  };

  // --- 背景预览 ---
  const renderBgCards = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 8px' }}>
      <div onClick={() => { setSelectedBgId(null); setShowBgSheet(false); }}
        style={{ padding: 8, border: selectedBgId === null ? '2px solid #1677ff' : '1px solid #e8e8e8', borderRadius: 8, cursor: 'pointer', textAlign: 'center', background: selectedBgId === null ? '#e6f4ff' : '#fff' }}>
        <div style={{ width: '100%', height: 60, border: '1px dashed #d9d9d9', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#999' }}>无背景</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>无</div>
      </div>
      {backgrounds.map(bg => (
        <div key={bg.id} onClick={() => { setSelectedBgId(bg.id); setShowBgSheet(false); }}
          style={{ padding: 8, border: selectedBgId === bg.id ? '2px solid #1677ff' : '1px solid #e8e8e8', borderRadius: 8, cursor: 'pointer', textAlign: 'center', background: selectedBgId === bg.id ? '#e6f4ff' : '#fff' }}>
          <div style={{ width: '100%', height: 60, borderRadius: 4, overflow: 'hidden', background: bg.color ? `#${bg.color}` : '#f5f5f5' }}>
            <img src={getBackgroundFileUrl(bg.id)} alt={bg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontSize: 10, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bg.name}</div>
        </div>
      ))}
    </div>
  );

  const typeLabel = (type: string) => {
    const map: Record<string, string> = { image: '图片', brush: '画笔', rect: '矩形', circle: '圆形', ellipse: '椭圆', text: '文字' };
    return map[type] || type;
  };

  const filteredMaterials = materials.filter(m => !materialSearch || m.original_name.toLowerCase().includes(materialSearch.toLowerCase()));

  // --- 画布设置界面 ---
  if (showCanvasSetup) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', padding: 16, background: '#f5f5f5' }}>
        <h2 style={{ textAlign: 'center', margin: '16px 0' }}>新建画布</h2>

        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14 }}>选择尺寸类型</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {CANVAS_PRESETS.map(p => (
              <div key={p.key}
                onClick={() => {
                  setPresetKey(p.key);
                  if (p.key !== 'custom') { setCanvasW(p.w); setCanvasH(p.h); }
                }}
                style={{
                  padding: 12, border: presetKey === p.key ? '2px solid #1677ff' : '1px solid #e8e8e8',
                  borderRadius: 8, cursor: 'pointer', background: presetKey === p.key ? '#e6f4ff' : '#fff',
                }}
              >
                <div style={{ fontWeight: 500, fontSize: 14 }}>{p.label}</div>
                {p.key !== 'custom' && <div style={{ fontSize: 12, color: '#999' }}>{p.w} x {p.h} px</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14 }}>选择背景</div>
          {renderBgCards()}
        </div>

        <Button block color="primary" size="large" onClick={handleCreateCanvas}>
          创建画布
        </Button>
      </div>
    );
  }

  // --- 主编辑器 ---
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden',
      background: '#e0e0e0', paddingTop: 'env(safe-area-inset-top, 0)',
      paddingBottom: 'env(safe-area-inset-bottom, 0)',
      paddingLeft: 'env(safe-area-inset-left, 0)',
      paddingRight: 'env(safe-area-inset-right, 0)',
      touchAction: 'none', // 禁用 WebView 默认手势
      WebkitUserSelect: 'none', userSelect: 'none',
    }}>
      {/* 画布区域 */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
        onClick={() => { setShowToolbar(prev => !prev); setContextMenu(null); }}
      >
        <div style={{
          transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.05s ease-out',
        }}>
          <Stage
            ref={stageRef}
            width={canvasW}
            height={canvasH}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTap={handleStageTap}
            onClick={handleStageTap}
            style={{ background: '#fff', touchAction: 'none' }}
          >
            <Layer>
              {bgImage && <KonvaImage image={bgImage} width={canvasW} height={canvasH} listening={false} />}
            </Layer>
            <Layer>
              {elements.map(el => {
                if (!el.visible) return null;
                const commonProps = {
                  id: el.id, x: el.x, y: el.y, rotation: el.rotation,
                  draggable: activeTool === 'select',
                  onTap: () => { if (activeTool === 'select') setSelectedId(el.id); },
                  onClick: () => { if (activeTool === 'select') setSelectedId(el.id); },
                  onDragEnd: (e: KonvaEventObject<DragEvent>) => handleDragEnd(el.id, e),
                  onTransformEnd: (e: KonvaEventObject<Event>) => handleTransformEnd(el.id, e),
                };

                if (el.type === 'image' && el.img) return <KonvaImage key={el.id} {...commonProps} image={el.img} width={el.width} height={el.height} />;
                if (el.type === 'brush') return <Line key={el.id} {...commonProps} points={el.points || []} stroke={el.strokeColor} strokeWidth={el.strokeWidth} tension={el.tension} lineCap="round" lineJoin="round" />;
                if (el.type === 'rect') return <Rect key={el.id} {...commonProps} width={el.width} height={el.height} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} />;
                if (el.type === 'circle') return <Circle key={el.id} {...commonProps} radius={el.radius || 50} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} />;
                if (el.type === 'ellipse') return <Ellipse key={el.id} {...commonProps} radiusX={el.radiusX || 50} radiusY={el.radiusY || 30} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} />;
                if (el.type === 'text') return <Text key={el.id} {...commonProps} text={el.text} fontSize={el.fontSize} fontFamily={el.fontFamily} fill={el.textFill} align={el.align} />;
                return null;
              })}
              {selectedId && (
                <Transformer ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10) ? oldBox : newBox}
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* 底部浮动工具栏 */}
      {showToolbar && (
        <div style={{
          position: 'fixed', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          zIndex: 50, backdropFilter: 'blur(10px)',
        }}>
          {TOOLS.map(t => (
            <Button key={t.key} size="small" color={activeTool === t.key ? 'primary' : 'default'}
              fill={activeTool === t.key ? 'solid' : 'none'}
              onClick={e => { e.stopPropagation(); setActiveTool(t.key); }}
              style={{ minWidth: 36, borderRadius: 12 }}
            >
              {t.icon}
            </Button>
          ))}
          <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 4px' }} />
          <Button size="small" fill="none" onClick={e => { e.stopPropagation(); handleUndo(); }}
            disabled={undoStack.length === 0} style={{ borderRadius: 12 }}>
            <UndoOutlined />
          </Button>
          <Button size="small" fill="none" onClick={e => { e.stopPropagation(); handleRedo(); }}
            disabled={redoStack.length === 0} style={{ borderRadius: 12 }}>
            <RedoOutlined />
          </Button>
          <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 4px' }} />
          <Button size="small" fill="none" onClick={e => { e.stopPropagation(); setShowMaterialSheet(true); }}
            style={{ borderRadius: 12 }}>
            <PictureOutlined />
          </Button>
          <Button size="small" fill="none" onClick={e => { e.stopPropagation(); setShowLayersSheet(true); }}
            style={{ borderRadius: 12 }}>
            <UnorderedListOutlined />
          </Button>
          <Button size="small" fill="none" onClick={e => { e.stopPropagation(); setShowPropertiesSheet(true); }}
            disabled={!selectedElement} style={{ borderRadius: 12 }}>
            <EyeOutlined />
          </Button>
        </div>
      )}

      {/* 图形类型选择 */}
      {activeTool === 'shape' && showToolbar && (
        <div style={{ position: 'fixed', bottom: 110, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
          <Segmented size="small" value={shapeType} onChange={v => setShapeType(v as ShapeType)}
            options={SHAPE_TYPES.map(s => ({ value: s.key, label: s.label }))}
            style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 4 }}
          />
        </div>
      )}

      {/* 颜色和画笔大小 */}
      {(activeTool === 'brush' || activeTool === 'shape' || activeTool === 'text') && showToolbar && (
        <div style={{ position: 'fixed', bottom: 110, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
          background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <ColorPicker value={globalColor} onChange={(_, hex) => setGlobalColor(hex)}>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: globalColor, border: '2px solid #e8e8e8', cursor: 'pointer' }} />
          </ColorPicker>
          {activeTool === 'brush' && (
            <Slider value={brushSize} min={2} max={16} step={2} onChange={v => setBrushSize(v as number)}
              style={{ width: 80, '--adm-color-primary': '#1677ff' }} />
          )}
        </div>
      )}

      {/* 缩放指示 + 重置按钮 */}
      <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 50 }}>
        <Button size="mini" fill="none" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: 12, fontSize: 12 }}
          onClick={() => resetView()}>
          {Math.round(scale * 100)}%
        </Button>
      </div>

      {/* 长按上下文菜单 */}
      {contextMenu && (
        <div style={{
          position: 'fixed', top: contextMenu.y, left: contextMenu.x,
          background: 'rgba(255,255,255,0.97)', borderRadius: 12, padding: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 200, minWidth: 140,
          backdropFilter: 'blur(10px)',
        }}
        onClick={e => e.stopPropagation()}
        >
          <div style={{ padding: '10px 16px', fontSize: 14, borderBottom: '1px solid #f0f0f0', cursor: 'pointer', borderRadius: '8px 8px 0 0' }}
            onClick={() => { setShowPropertiesSheet(true); setContextMenu(null); }}>
            属性
          </div>
          <div style={{ padding: '10px 16px', fontSize: 14, borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
            onClick={() => { moveLayer('up'); setContextMenu(null); }}>
            上移一层
          </div>
          <div style={{ padding: '10px 16px', fontSize: 14, borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
            onClick={() => { moveLayer('down'); setContextMenu(null); }}>
            下移一层
          </div>
          <div style={{ padding: '10px 16px', fontSize: 14, borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
            onClick={() => { toggleVisibility(contextMenu.elId); setContextMenu(null); }}>
            {elements.find(el => el.id === contextMenu.elId)?.visible ? '隐藏' : '显示'}
          </div>
          <div style={{ padding: '10px 16px', fontSize: 14, color: '#ff4d4f', cursor: 'pointer', borderRadius: '0 0 8px 8px' }}
            onClick={() => { handleDelete(); setContextMenu(null); }}>
            删除
          </div>
        </div>
      )}

      {/* 快捷操作按钮 */}
      <div style={{ position: 'fixed', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 50 }}>
        <Button size="mini" fill="none" style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 12 }}
          onClick={handleNew}>新建</Button>
        <Button size="mini" fill="none" style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 12 }}
          onClick={handleOpenLoad}>加载</Button>
        <Button size="mini" fill="none" style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 12 }}
          onClick={() => setShowSaveSheet(true)}>保存</Button>
        <Button size="mini" fill="none" style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 12 }}
          onClick={handleExport} disabled={elements.length === 0}>导出</Button>
      </div>

      {/* 素材库弹出面板 */}
      <Popup visible={showMaterialSheet} onClose={() => setShowMaterialSheet(false)} position="bottom" bodyStyle={{ height: '50vh', overflow: 'auto', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <div style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>选择素材</h3>
          <Input placeholder="搜索素材..." value={materialSearch} onChange={setMaterialSearch} clearable style={{ marginBottom: 12 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {filteredMaterials.map(m => (
              <div key={m.id} onClick={() => addMaterial(m)}
                style={{ cursor: 'pointer', border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                <div style={{ width: '100%', aspectRatio: '1', background: 'repeating-conic-gradient(#e8e8e8 0% 25%, transparent 0% 50%) 50% / 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={m.has_removed_bg === 'done' ? `${getMaterialFileUrl(m.id)}?removed=true` : getMaterialFileUrl(m.id)}
                    alt={m.original_name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: 11, padding: '4px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.original_name}</div>
              </div>
            ))}
            {filteredMaterials.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 32, color: '#999' }}>暂无素材</div>}
          </div>
        </div>
      </Popup>

      {/* 属性编辑弹出面板 */}
      <Popup visible={showPropertiesSheet} onClose={() => setShowPropertiesSheet(false)} position="bottom" bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <div style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>属性</h3>
          {!selectedElement ? (
            <div style={{ color: '#999', textAlign: 'center', padding: 24 }}>点击画布上的元素查看属性</div>
          ) : (
            <div>
              <div style={{ marginBottom: 8 }}><span style={{ color: '#999' }}>类型：</span>{typeLabel(selectedElement.type)}</div>
              <div style={{ marginBottom: 8 }}><span style={{ color: '#999' }}>位置：</span>X: {Math.round(selectedElement.x)}, Y: {Math.round(selectedElement.y)}</div>
              {(selectedElement.type === 'rect' || selectedElement.type === 'circle' || selectedElement.type === 'ellipse') && (
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#999' }}>填充：</span>
                  <ColorPicker value={selectedElement.fill || '#ffffff80'} onChange={(_, hex) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fill: hex } : el))}>
                    <div style={{ width: 28, height: 28, borderRadius: 14, background: selectedElement.fill || '#fff', border: '2px solid #e8e8e8', cursor: 'pointer' }} />
                  </ColorPicker>
                  <span style={{ color: '#999' }}>描边：</span>
                  <ColorPicker value={selectedElement.stroke || '#000000'} onChange={(_, hex) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, stroke: hex } : el))}>
                    <div style={{ width: 28, height: 28, borderRadius: 14, background: selectedElement.stroke || '#000', border: '2px solid #e8e8e8', cursor: 'pointer' }} />
                  </ColorPicker>
                </div>
              )}
              {selectedElement.type === 'text' && (
                <div style={{ marginBottom: 8 }}>
                  <Input.TextArea value={selectedElement.text} onChange={val => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, text: val } : el))} rows={3} />
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#999' }}>颜色：</span>
                    <ColorPicker value={selectedElement.textFill} onChange={(_, hex) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, textFill: hex } : el))}>
                      <div style={{ width: 28, height: 28, borderRadius: 14, background: selectedElement.textFill || '#000', border: '2px solid #e8e8e8', cursor: 'pointer' }} />
                    </ColorPicker>
                  </div>
                </div>
              )}
              {selectedElement.type === 'brush' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ color: '#999' }}>颜色：</span>
                  <ColorPicker value={selectedElement.strokeColor || '#000'} onChange={(_, hex) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, strokeColor: hex } : el))}>
                    <div style={{ width: 28, height: 28, borderRadius: 14, background: selectedElement.strokeColor || '#000', border: '2px solid #e8e8e8', cursor: 'pointer' }} />
                  </ColorPicker>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Button color="danger" size="small" onClick={handleDelete}><DeleteOutlined /> 删除</Button>
                <Button size="small" onClick={() => { moveLayer('up'); setShowPropertiesSheet(false); }}>上移</Button>
                <Button size="small" onClick={() => { moveLayer('down'); setShowPropertiesSheet(false); }}>下移</Button>
              </div>
            </div>
          )}
        </div>
      </Popup>

      {/* 图层面板 */}
      <Popup visible={showLayersSheet} onClose={() => setShowLayersSheet(false)} position="bottom" bodyStyle={{ height: '50vh', overflow: 'auto', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <div style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>图层 ({elements.length})</h3>
          {elements.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', padding: 24 }}>暂无元素</div>
          ) : (
            [...elements].reverse().map((el, revIdx) => {
              const idx = elements.length - 1 - revIdx;
              const label = el.type === 'image' ? (materials.find(m => m.id === el.material_id)?.original_name || '图片') :
                el.type === 'brush' ? '画笔' : el.type === 'rect' ? '矩形' : el.type === 'circle' ? '圆形' : el.type === 'ellipse' ? '椭圆' : el.text?.slice(0, 6) || '文字';
              return (
                <div key={el.id}
                  onClick={() => { setActiveTool('select'); setSelectedId(el.id); setShowLayersSheet(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                    background: selectedId === el.id ? '#e6f4ff' : '#f9f9f9', marginBottom: 4, opacity: el.visible ? 1 : 0.4,
                  }}>
                  <div style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                  <Button size="mini" fill="none" onClick={e => { e.stopPropagation(); toggleVisibility(el.id); }}>
                    {el.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  </Button>
                  <Button size="mini" fill="none" disabled={idx >= elements.length - 1} onClick={e => { e.stopPropagation(); setSelectedId(el.id); moveLayer('up'); }}>↑</Button>
                  <Button size="mini" fill="none" disabled={idx <= 0} onClick={e => { e.stopPropagation(); setSelectedId(el.id); moveLayer('down'); }}>↓</Button>
                </div>
              );
            })
          )}
        </div>
      </Popup>

      {/* 背景选择 */}
      <Popup visible={showBgSheet} onClose={() => setShowBgSheet(false)} position="bottom" bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <div style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>选择背景</h3>
          {renderBgCards()}
        </div>
      </Popup>

      {/* 保存弹窗 */}
      <Popup visible={showSaveSheet} onClose={() => setShowSaveSheet(false)} position="bottom" bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <div style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>保存拼贴方案</h3>
          <Input placeholder="输入方案名称" value={collageName} onChange={setCollageName} style={{ marginBottom: 16 }} />
          <Button block color="primary" onClick={handleSave}>保存</Button>
        </div>
      </Popup>

      {/* 加载弹窗 */}
      <Popup visible={showLoadSheet} onClose={() => setShowLoadSheet(false)} position="bottom" bodyStyle={{ height: '50vh', overflow: 'auto', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <div style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>加载拼贴方案</h3>
          {collageList.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', padding: 24 }}>暂无已保存的方案</div>
          ) : (
            collageList.map(c => (
              <div key={c.id} onClick={() => handleLoad(c.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: 8, cursor: 'pointer', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{new Date(c.updated_at).toLocaleString()}</div>
                </div>
                <Button size="mini" color="danger" fill="none" onClick={e => { e.stopPropagation(); handleDeleteCollage(c.id); }}>
                  <DeleteOutlined />
                </Button>
              </div>
            ))
          )}
        </div>
      </Popup>

      {/* 文字输入弹窗 */}
      <Dialog
        visible={showTextInput}
        title="输入文字"
        content={<Input.TextArea value={textInput} onChange={setTextInput} rows={3} placeholder="输入文字内容..." />}
        onClose={() => setShowTextInput(false)}
        actions={[
          { key: 'cancel', text: '取消', onClick: () => setShowTextInput(false) },
          { key: 'confirm', text: '确定', bold: true, onClick: handleTextConfirm },
        ]}
      />
    </div>
  );
}