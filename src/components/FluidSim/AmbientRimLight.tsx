import React, { useEffect, useRef, useState } from 'react';

interface ColorSegment {
  position: number;
  color: string;
}

interface AmbientRimLightProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  sampleRate?: number;
  segmentSize?: number; // Size of each segment in pixels
}

export const AmbientRimLight: React.FC<AmbientRimLightProps> = ({
  canvasRef,
  sampleRate = 50,
  segmentSize = 25
}) => {
  const [topSegments, setTopSegments] = useState<ColorSegment[]>([]);
  const [bottomSegments, setBottomSegments] = useState<ColorSegment[]>([]);
  const [leftSegments, setLeftSegments] = useState<ColorSegment[]>([]);
  const [rightSegments, setRightSegments] = useState<ColorSegment[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastSampleTime = useRef<number>(0);

  useEffect(() => {
    const sampleCanvasColors = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameRef.current = requestAnimationFrame(sampleCanvasColors);
        return;
      }

      // Only sample at specified rate
      if (timestamp - lastSampleTime.current < sampleRate) {
        animationFrameRef.current = requestAnimationFrame(sampleCanvasColors);
        return;
      }
      lastSampleTime.current = timestamp;

      try {
        const gl = canvas.getContext('webgl2');
        if (!gl) {
          animationFrameRef.current = requestAnimationFrame(sampleCanvasColors);
          return;
        }

        const width = canvas.width;
        const height = canvas.height;
        const rimDepth = 20;

        const newTopSegments: ColorSegment[] = [];
        const newBottomSegments: ColorSegment[] = [];
        const newLeftSegments: ColorSegment[] = [];
        const newRightSegments: ColorSegment[] = [];

        // Sample top edge in segments
        for (let x = 0; x < width; x += segmentSize) {
          const segmentWidth = Math.min(segmentSize, width - x);
          const pixels = new Uint8Array(segmentWidth * rimDepth * 4);
          gl.readPixels(x, height - rimDepth, segmentWidth, rimDepth, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          const avg = averageColor(pixels);
          newTopSegments.push({
            position: x,
            color: `rgba(${avg.r}, ${avg.g}, ${avg.b}, 0.8)`
          });
        }

        // Sample bottom edge in segments
        for (let x = 0; x < width; x += segmentSize) {
          const segmentWidth = Math.min(segmentSize, width - x);
          const pixels = new Uint8Array(segmentWidth * rimDepth * 4);
          gl.readPixels(x, 0, segmentWidth, rimDepth, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          const avg = averageColor(pixels);
          newBottomSegments.push({
            position: x,
            color: `rgba(${avg.r}, ${avg.g}, ${avg.b}, 0.8)`
          });
        }

        // Sample left edge in segments
        for (let y = 0; y < height; y += segmentSize) {
          const segmentHeight = Math.min(segmentSize, height - y);
          const pixels = new Uint8Array(rimDepth * segmentHeight * 4);
          gl.readPixels(0, height - y - segmentHeight, rimDepth, segmentHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          const avg = averageColor(pixels);
          newLeftSegments.push({
            position: y,
            color: `rgba(${avg.r}, ${avg.g}, ${avg.b}, 0.8)`
          });
        }

        // Sample right edge in segments
        for (let y = 0; y < height; y += segmentSize) {
          const segmentHeight = Math.min(segmentSize, height - y);
          const pixels = new Uint8Array(rimDepth * segmentHeight * 4);
          gl.readPixels(width - rimDepth, height - y - segmentHeight, rimDepth, segmentHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          const avg = averageColor(pixels);
          newRightSegments.push({
            position: y,
            color: `rgba(${avg.r}, ${avg.g}, ${avg.b}, 0.8)`
          });
        }

        setTopSegments(newTopSegments);
        setBottomSegments(newBottomSegments);
        setLeftSegments(newLeftSegments);
        setRightSegments(newRightSegments);
      } catch (error) {
        // Canvas might not be ready or accessible
        console.debug('Canvas sampling error:', error);
      }

      animationFrameRef.current = requestAnimationFrame(sampleCanvasColors);
    };

    animationFrameRef.current = requestAnimationFrame(sampleCanvasColors);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasRef, sampleRate, segmentSize]);

  const averageColor = (data: Uint8Array | Uint8ClampedArray): { r: number; g: number; b: number } => {
    let r = 0, g = 0, b = 0, count = 0;

    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }

    return {
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count)
    };
  };

  return (
    <>
      {/* Top edge lights */}
      {topSegments.map((segment, i) => {
        const canvas = canvasRef.current;
        const canvasWidth = canvas?.width || 1024;
        return (
          <div
            key={`top-${i}`}
            className="absolute pointer-events-none blur-2xl transition-all duration-300"
            style={{
              top: '-80px',
              left: `${(segment.position / canvasWidth) * 100}%`,
              width: `${(segmentSize / canvasWidth) * 100}%`,
              height: '100px',
              background: `radial-gradient(ellipse at bottom, ${segment.color}, transparent 70%)`
            }}
          />
        );
      })}

      {/* Bottom edge lights */}
      {bottomSegments.map((segment, i) => {
        const canvas = canvasRef.current;
        const canvasWidth = canvas?.width || 1024;
        return (
          <div
            key={`bottom-${i}`}
            className="absolute pointer-events-none blur-2xl transition-all duration-300"
            style={{
              bottom: '-80px',
              left: `${(segment.position / canvasWidth) * 100}%`,
              width: `${(segmentSize / canvasWidth) * 100}%`,
              height: '100px',
              background: `radial-gradient(ellipse at top, ${segment.color}, transparent 70%)`
            }}
          />
        );
      })}

      {/* Left edge lights */}
      {leftSegments.map((segment, i) => {
        const canvas = canvasRef.current;
        const canvasHeight = canvas?.height || 720;
        return (
          <div
            key={`left-${i}`}
            className="absolute pointer-events-none blur-2xl transition-all duration-300"
            style={{
              left: '-80px',
              top: `${(segment.position / canvasHeight) * 100}%`,
              width: '100px',
              height: `${(segmentSize / canvasHeight) * 100}%`,
              background: `radial-gradient(ellipse at right, ${segment.color}, transparent 70%)`
            }}
          />
        );
      })}

      {/* Right edge lights */}
      {rightSegments.map((segment, i) => {
        const canvas = canvasRef.current;
        const canvasHeight = canvas?.height || 720;
        return (
          <div
            key={`right-${i}`}
            className="absolute pointer-events-none blur-2xl transition-all duration-300"
            style={{
              right: '-80px',
              top: `${(segment.position / canvasHeight) * 100}%`,
              width: '100px',
              height: `${(segmentSize / canvasHeight) * 100}%`,
              background: `radial-gradient(ellipse at left, ${segment.color}, transparent 70%)`
            }}
          />
        );
      })}
    </>
  );
};
