import * as Config from './config.js';

export function circle(ctx,x,y,r,col_inner){
    ctx.beginPath();
    ctx.arc(x,y,r,0,2*Math.PI);

    ctx.fillStyle= col_inner;
    ctx.fill();
}

export function line(ctx,x1,y1,x2,y2,col,width){
    ctx.strokeStyle= col;
    ctx.lineWidth= width;

    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
}

export function text(ctx,x,y,text,size){
    ctx.font= `${size}px Arial`;
    ctx.fillStyle=`black`;
    ctx.fillText(text,x,y);
}

export function clear_canvas(ctx, height, width){
    ctx.fillStyle=`lightblue`;
    ctx.fillRect(0,0,width,height);
}

export function draw_terrain(ctx){
    ctx.beginPath();
    ctx.moveTo(0,Config.terrainGet(0));
    for (let x=100; x<=Config.canvasMainWidth; x+=100){
        ctx.lineTo(x, Config.terrainGet(x));
    }
    ctx.lineTo(Config.canvasMainWidth,Config.canvasMainHeight);
    ctx.lineTo(0, Config.canvasMainHeight);
    ctx.closePath();
    ctx.fillStyle= 'brown';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0,Config.terrainGet(0));
    for (let x=100; x<=Config.canvasMainWidth; x+=100){
        ctx.lineTo(x, Config.terrainGet(x));
    }
    ctx.lineTo(Config.canvasMainWidth,Config.terrainGet(Config.canvasMainWidth)+20);
    for (let x=Config.canvasMainWidth; x>=0; x-=100){
        ctx.lineTo(x, Config.terrainGet(x)+20);
    }
    ctx.closePath();
    ctx.fillStyle= 'black';
    ctx.fill();
}