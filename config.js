import * as Terrain from './terrain.js';

export const canvasMainWidth= 2000,
             canvasMainHeight= 1000,
             canvasStatWidth= 1200,
             canvasStatHeight= 900,
             FPSCap= 60,
             DT= Math.floor(1000/FPSCap),
             statUpdateInterval= 500,
             avgValperiod= 120,
             terrainGet= Terrain.parabolic;

export const drawLeaf= true,
             drawRoot= true,
             clearCanvas= true;

export const drawRainDropCollision= false,
             drawAirMolecule= false;