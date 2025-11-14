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