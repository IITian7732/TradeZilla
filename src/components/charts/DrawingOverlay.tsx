import React, { useRef, useEffect, useState } from 'react';

interface DrawingOverlayProps {
  activeTool: string;
  width: number;
  height: number;
}

export const DrawingOverlay: React.FC<DrawingOverlayProps> = ({ activeTool, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  // We could store completed drawings here to re-render them
  const [drawings, setDrawings] = useState<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and redraw all saved drawings
    ctx.clearRect(0, 0, width, height);
    drawings.forEach(d => {
      ctx.strokeStyle = d.color || '#2196F3';
      ctx.lineWidth = d.lineWidth || 2;
      ctx.setLineDash(d.dash || []);
      
      ctx.beginPath();
      if (d.type === 'trend_line' || d.type === 'horizontal_line' || d.type === 'vertical_line') {
        ctx.moveTo(d.startX, d.startY);
        ctx.lineTo(d.endX, d.endY);
        ctx.stroke();
      } else if (d.type === 'rectangle') {
        ctx.strokeRect(d.startX, d.startY, d.endX - d.startX, d.endY - d.startY);
      } else if (d.type === 'fib_retracement') {
        ctx.strokeStyle = '#9C27B0';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        const h = Math.abs(d.endY - d.startY);
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        levels.forEach(level => {
          const y = d.startY + h * level;
          ctx.beginPath();
          ctx.moveTo(d.startX, y);
          ctx.lineTo(d.endX, y);
          ctx.stroke();
        });
        ctx.setLineDash([]);
      }
    });

  }, [drawings, width, height]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'cursor' || activeTool === 'alert') return;
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    setStartX(e.clientX - rect.left);
    setStartY(e.clientY - rect.top);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || activeTool === 'cursor' || activeTool === 'alert') return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Redraw all saved drawings first
    ctx.clearRect(0, 0, width, height);
    // (In a full implementation, we'd extract the redraw logic to a helper function)
    drawings.forEach(d => {
      ctx.strokeStyle = d.color || '#2196F3';
      ctx.lineWidth = d.lineWidth || 2;
      ctx.setLineDash(d.dash || []);
      ctx.beginPath();
      if (d.type === 'trend_line' || d.type === 'horizontal_line' || d.type === 'vertical_line') {
        ctx.moveTo(d.startX, d.startY);
        ctx.lineTo(d.endX, d.endY);
        ctx.stroke();
      } else if (d.type === 'rectangle') {
        ctx.strokeRect(d.startX, d.startY, d.endX - d.startX, d.endY - d.startY);
      } else if (d.type === 'fib_retracement') {
        ctx.strokeStyle = '#9C27B0';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        const h = Math.abs(d.endY - d.startY);
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        levels.forEach(level => {
          const y = d.startY + h * level;
          ctx.beginPath();
          ctx.moveTo(d.startX, y);
          ctx.lineTo(d.endX, y);
          ctx.stroke();
        });
        ctx.setLineDash([]);
      }
    });

    // Now draw the current interactive shape
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    
    if (activeTool === 'trend_line') {
      ctx.strokeStyle = '#FF6B6B';
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
    } else if (activeTool === 'horizontal_line') {
      ctx.strokeStyle = '#2196F3';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(0, startY);
      ctx.lineTo(width, startY);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (activeTool === 'vertical_line') {
      ctx.strokeStyle = '#2196F3';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (activeTool === 'rectangle') {
      ctx.strokeStyle = '#FF9800';
      ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
    } else if (activeTool === 'fib_retracement') {
      ctx.strokeStyle = '#9C27B0';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      const h = Math.abs(currentY - startY);
      const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
      levels.forEach(level => {
        const y = startY + h * level;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(currentX, y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || activeTool === 'cursor' || activeTool === 'alert') return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let currentX = e.clientX - rect.left;
    let currentY = e.clientY - rect.top;

    if (activeTool === 'horizontal_line') {
      currentX = width;
      setStartX(0);
    } else if (activeTool === 'vertical_line') {
      currentY = height;
      setStartY(0);
    }

    const newDrawing = {
      type: activeTool,
      startX: activeTool === 'horizontal_line' ? 0 : startX,
      startY: activeTool === 'vertical_line' ? 0 : startY,
      endX: activeTool === 'vertical_line' ? startX : currentX,
      endY: activeTool === 'horizontal_line' ? startY : currentY,
      color: activeTool === 'trend_line' ? '#FF6B6B' : (activeTool === 'rectangle' ? '#FF9800' : '#2196F3'),
      dash: (activeTool === 'horizontal_line' || activeTool === 'vertical_line') ? [5, 5] : []
    };
    
    setDrawings([...drawings, newDrawing]);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: (activeTool === 'cursor' || activeTool === 'alert') ? 'none' : 'auto',
        zIndex: 20
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};
