// src/effects/tessellationMapper.js
import { makePalette } from '../palette/palette.js';

export class TessellationMapper {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.patterns = new Map();
    this.textureCache = new Map();
  }

  // Generate tessellation patterns
  generateTessellationTexture(type, size = 256, params = {}) {
    const cacheKey = `${type}_${size}_${JSON.stringify(params)}`;
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey);
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const palette = params.palette || makePalette(5);
    
    switch (type) {
      case 'hexagonal':
        this.drawHexagonalTessellation(ctx, size, palette, params);
        break;
      case 'triangular':
        this.drawTriangularTessellation(ctx, size, palette, params);
        break;
      case 'square':
        this.drawSquareTessellation(ctx, size, palette, params);
        break;
      case 'penrose':
        this.drawPenroseTessellation(ctx, size, palette, params);
        break;
      case 'voronoi':
        this.drawVoronoiTessellation(ctx, size, palette, params);
        break;
      default:
        this.drawHexagonalTessellation(ctx, size, palette, params);
    }

    const texture = {
      canvas: canvas,
      imageData: ctx.getImageData(0, 0, size, size),
      type: type,
      size: size,
      params: params
    };

    this.textureCache.set(cacheKey, texture);
    return texture;
  }

  drawHexagonalTessellation(ctx, size, palette, params) {
    const hexSize = params.hexSize || 20;
    const rows = Math.ceil(size / (hexSize * 1.5));
    const cols = Math.ceil(size / (hexSize * Math.sqrt(3)));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * hexSize * Math.sqrt(3) + (row % 2) * hexSize * Math.sqrt(3) / 2;
        const y = row * hexSize * 1.5;
        
        if (x < size + hexSize && y < size + hexSize) {
          const colorIndex = (row + col) % palette.length;
          this.drawHexagon(ctx, x, y, hexSize, palette[colorIndex]);
        }
      }
    }
  }

  drawTriangularTessellation(ctx, size, palette, params) {
    const triSize = params.triSize || 30;
    const height = triSize * Math.sqrt(3) / 2;
    
    for (let row = 0; row < size / height + 2; row++) {
      for (let col = 0; col < size / triSize + 2; col++) {
        const x = col * triSize + (row % 2) * triSize / 2;
        const y = row * height;
        
        const colorIndex = (row + col) % palette.length;
        const pointUp = (row + col) % 2 === 0;
        this.drawTriangle(ctx, x, y, triSize, palette[colorIndex], pointUp);
      }
    }
  }

  drawSquareTessellation(ctx, size, palette, params) {
    const squareSize = params.squareSize || 25;
    const pattern = params.pattern || 'checkerboard';
    
    for (let x = 0; x < size; x += squareSize) {
      for (let y = 0; y < size; y += squareSize) {
        let colorIndex;
        
        if (pattern === 'checkerboard') {
          colorIndex = ((x / squareSize) + (y / squareSize)) % 2;
        } else if (pattern === 'spiral') {
          const centerX = size / 2;
          const centerY = size / 2;
          const angle = Math.atan2(y - centerY, x - centerX);
          colorIndex = Math.floor((angle + Math.PI) / (2 * Math.PI) * palette.length);
        } else {
          colorIndex = Math.floor(Math.random() * palette.length);
        }
        
        ctx.fillStyle = palette[colorIndex % palette.length];
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }
  }

  drawPenroseTessellation(ctx, size, palette, params) {
    // Simplified Penrose-like pattern
    const scale = params.scale || 40;
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    
    for (let i = 0; i < 200; i++) {
      const angle1 = (i * phi * 2 * Math.PI) % (2 * Math.PI);
      const angle2 = ((i + 1) * phi * 2 * Math.PI) % (2 * Math.PI);
      
      const r1 = scale * (1 + 0.3 * Math.sin(i * 0.1));
      const r2 = scale * (1 + 0.3 * Math.sin((i + 1) * 0.1));
      
      const x1 = size / 2 + r1 * Math.cos(angle1);
      const y1 = size / 2 + r1 * Math.sin(angle1);
      const x2 = size / 2 + r2 * Math.cos(angle2);
      const y2 = size / 2 + r2 * Math.sin(angle2);
      
      ctx.strokeStyle = palette[i % palette.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size / 2, size / 2);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawVoronoiTessellation(ctx, size, palette, params) {
    const numSeeds = params.numSeeds || 20;
    const seeds = [];
    
    // Generate random seed points
    for (let i = 0; i < numSeeds; i++) {
      seeds.push({
        x: Math.random() * size,
        y: Math.random() * size,
        color: palette[i % palette.length]
      });
    }
    
    // Create Voronoi diagram
    const imageData = ctx.createImageData(size, size);
    
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        let minDist = Infinity;
        let closestSeed = seeds[0];
        
        for (const seed of seeds) {
          const dist = Math.sqrt((x - seed.x) ** 2 + (y - seed.y) ** 2);
          if (dist < minDist) {
            minDist = dist;
            closestSeed = seed;
          }
        }
        
        const pixelIndex = (y * size + x) * 4;
        const color = this.hexToRgb(closestSeed.color);
        imageData.data[pixelIndex] = color.r;
        imageData.data[pixelIndex + 1] = color.g;
        imageData.data[pixelIndex + 2] = color.b;
        imageData.data[pixelIndex + 3] = 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  drawHexagon(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const hexX = x + size * Math.cos(angle);
      const hexY = y + size * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(hexX, hexY);
      } else {
        ctx.lineTo(hexX, hexY);
      }
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawTriangle(ctx, x, y, size, color, pointUp) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    const height = size * Math.sqrt(3) / 2;
    
    if (pointUp) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + size / 2, y + height);
      ctx.lineTo(x - size / 2, y + height);
    } else {
      ctx.moveTo(x, y + height);
      ctx.lineTo(x + size / 2, y);
      ctx.lineTo(x - size / 2, y);
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Apply tessellation to object vertices
  mapTessellationToObject(vertices, tessellationType, params = {}) {
    const texture = this.generateTessellationTexture(tessellationType, 512, params);
    const mappedVertices = [];
    
    for (let i = 0; i < vertices.length; i += 3) {
      const vertex = {
        x: vertices[i],
        y: vertices[i + 1],
        z: vertices[i + 2]
      };
      
      // Calculate UV coordinates based on vertex position
      const u = (vertex.x + 1) / 2; // Normalize to 0-1
      const v = (vertex.y + 1) / 2;
      
      // Sample texture at UV coordinates
      const color = this.sampleTexture(texture, u, v);
      
      mappedVertices.push({
        ...vertex,
        color: color,
        uv: { u, v }
      });
    }
    
    return mappedVertices;
  }

  // Apply tessellation to landscape terrain
  mapTessellationToLandscape(terrainData, tessellationType, params = {}) {
    const texture = this.generateTessellationTexture(tessellationType, 1024, params);
    
    return terrainData.map(terrain => {
      if (terrain.type === 'plane' || terrain.type === 'sphere' || terrain.type === 'cone') {
        const u = (terrain.position[0] + 10) / 20; // Normalize based on terrain bounds
        const v = (terrain.position[2] + 10) / 20;
        
        const sampledColor = this.sampleTexture(texture, u, v);
        
        return {
          ...terrain,
          tessellationColor: sampledColor,
          tessellationType: tessellationType,
          originalColor: terrain.color
        };
      }
      return terrain;
    });
  }

  sampleTexture(texture, u, v) {
    const x = Math.floor(u * texture.size) % texture.size;
    const y = Math.floor(v * texture.size) % texture.size;
    const pixelIndex = (y * texture.size + x) * 4;
    
    const r = texture.imageData.data[pixelIndex];
    const g = texture.imageData.data[pixelIndex + 1];
    const b = texture.imageData.data[pixelIndex + 2];
    
    return [r / 255, g / 255, b / 255];
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  // Create a scene with tessellated objects and landscapes
  createTessellatedScene(sceneConfig, tessellationType, tessellationParams) {
    const tessellatedScene = JSON.parse(JSON.stringify(sceneConfig));
    
    // Apply tessellation to terrain if it exists
    if (tessellatedScene.terrain) {
      tessellatedScene.terrain = this.mapTessellationToLandscape(
        tessellatedScene.terrain, 
        tessellationType, 
        tessellationParams
      );
    }
    
    // Add tessellation metadata
    tessellatedScene.tessellation = {
      type: tessellationType,
      params: tessellationParams,
      appliedAt: new Date().toISOString()
    };
    
    return tessellatedScene;
  }
}