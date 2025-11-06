console.log("JS file loaded!");
import * as Data from './data.js';
import * as Config from './config.js';
import { sleep, randint, randsign, testChance, collision_line, get_direction, get_boundingBox, collision_box, to_rad } from './helper.js';

const canvas= document.getElementById(`canvas`);
const ctx= canvas.getContext(`2d`);

canvas.width= Config.canvasWidth;
canvas.height=Config.canvasHeight;

ctx.lineCap= 'round';

function draw_circle(x,y,r,col_inner){
    ctx.beginPath();
    ctx.arc(x,y,r,0,2*Math.PI);

    ctx.fillStyle= col_inner;
    ctx.fill();
}

function draw_line(x1,y1,x2,y2,col,width){
    ctx.strokeStyle= col;
    ctx.lineWidth= width;

    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
}

function draw_text(x,y,text,size){
    ctx.font= `${size}px Arial`;
    ctx.fillStyle=`black`;
    ctx.fillText(text,x,y);
}

function clear_canvas(){
    ctx.fillStyle=`lightblue`;
    ctx.fillRect(0,0,canvas.width,canvas.height);
}

class TreeNode{
    constructor(rel_angle, length, parent, data, nodeList, isroot=false){
        this.x= 0;
        this.y= 0;

        this.d_angle=0;
        this.d_angle_speed=0;
        this.rel_angle= rel_angle;
        this.abs_angle=900;
        this.length= length;

        this.isroot= isroot;
        this.data= data;
        this.parent= parent;
        this.child= [];
        nodeList.push(this);
    }

    async grow(nodeList, leafList, countminimum, countLimit, ChildChance=this.data.ChildChance, StopChance=this.data.StopChance){
        if (!(nodeList.length<countminimum) && (nodeList.length>=countLimit || testChance(StopChance))){
            leafList.push(this);
            this.leafRadius= randint(this.data.MinLeafRadius,this.data.MaxLeafRadius);
            return;
        }

        this.child.push(new TreeNode(randint(0, this.data.FirstChildMaxAngle)*randsign(),
                                     randint(this.data.MinLength, this.data.MaxLength),
                                     this,
                                     this.data,
                                     nodeList));

        while (this.child.length<this.data.MaxChild && nodeList.length<countLimit && testChance(ChildChance))

            this.child.push(new TreeNode(randint(this.data.ChildMinAngle, this.data.ChildMaxAngle)*randsign(),
                                         randint(this.data.MinLength, this.data.MaxLength),
                                         this,
                                         this.data,
                                         nodeList));
        
        for (const child of this.child)
            child.grow(nodeList, leafList, countminimum, countLimit, ChildChance+this.data.ChildChance_PerNode, StopChance+this.data.StopChance_PerNode);
    }

    update(){
        this.d_angle+= this.d_angle_speed;
        this.d_angle_speed= Math.trunc(this.d_angle_speed*0.8);
        this.d_angle= Math.trunc(this.d_angle*0.8);

        this.abs_angle= this.parent.abs_angle + this.rel_angle + this.d_angle;
        this.x= this.parent.x + Math.round(this.length*Math.cos(to_rad(this.abs_angle)));
        this.y= this.parent.y - Math.round(this.length*Math.sin(to_rad(this.abs_angle)));
    }

    draw_branch(){
        if (this.parent===null)
            return;
        draw_line(this.x,this.y,this.parent.x,this.parent.y,this.data.BranchCol,this.data.Diameter);
    }

    draw_leaf(){
        draw_circle(this.x,this.y,this.leafRadius,this.data.LeafCol);
        let _offSet= Math.floor(this.leafRadius/2);
        //để như này cho đẹp :)))
        draw_circle(this.x-_offSet-5,this.y+_offSet-5,this.leafRadius-_offSet+5,this.data.LeafCol);
        draw_circle(this.x+_offSet+5,this.y+_offSet-5,this.leafRadius-_offSet+5,this.data.LeafCol);
    }
}

let TreeList=[], RainDropList=[];

class Tree{
    constructor(x,y,data){
        this.x= x;
        this.y= y;

        this.abs_angle=900;

        this.data= data;
        this.nodeList= [];
        this.leafList= [];
        this.root= new TreeNode(0, 0, this, data.NodeData, this.nodeList, true);
        this.root.grow(this.nodeList, this.leafList, this.data.MinNodeCount, this.data.MaxNodeCount);
        this.update();

        TreeList.push(this);
    }

    update(){

        for (const node of this.nodeList)
            node.update();

        this.boundingBox= get_boundingBox(...this.nodeList);
    }

    draw_branch(){
        for (const node of this.nodeList)
            node.draw_branch();

        if (!Config.drawRoot)
            return;
        for (let offSet= -Math.ceil(this.data.NodeData.Diameter/2); offSet<=this.data.NodeData.Diameter/2; offSet+=this.data.NodeData.Diameter)
            draw_line(this.x+offSet, this.y+10, this.x, this.y-10, this.data.NodeData.BranchCol, this.data.NodeData.Diameter);
    }

    draw_leaf(){
        for (const node of this.leafList)
            node.draw_leaf();
    }
}

class RainDrop{
    constructor(x, y, sx, sy){
        this.x= x;
        this.y= y;
        this.sx= sx;
        this.sy= sy;
        this.exist= true;

        RainDropList.push(this);
    }

    update(){
        let _lastCord= {x: this.x, y:this.y};

        this.x+= this.sx;
        this.y+= this.sy;

        if (this.y>1000){
            this.exist= false;
            return;
        }
        
        let _cord= {x: this.x, y:this.y};
        let _boundingBox= get_boundingBox(_cord,_lastCord);

        for (const tree of TreeList){
            if (!collision_box(_boundingBox, tree.boundingBox))
                continue;

            for (const node of tree.nodeList){
                if (node.parent===null) continue;
                if (collision_line(_lastCord, _cord, node, node.parent)){
                    this.exist= false;
                    node.d_angle_speed-=3*get_direction(node, node.parent, _lastCord);
                    
                    if (Config.drawRainDropCollision)
                        draw_circle(this.x, this.y, 15, 'red');

                    return;
                }
            }
        }
        if (this.x<0 && this.sx<0)
            this.x+= 2000;
        else if (this.x>2000 && this.sx>0)
            this.x-= 2000;
    }

    draw(){
        draw_line(this.x-this.sx, this.y-this.sy, this.x, this.y, 'blue', 1);
    }
}

async function run(){
    while (true){
        let _timeStart= Date.now();

        if (Config.clearCanvas)
            clear_canvas();

        for (const tree of TreeList)
            tree.update();

        for (const raindrop of RainDropList)
            raindrop.update();

        RainDropList= RainDropList.filter((obj)=>{
            return obj.exist===true;
        });

        for (const raindrop of RainDropList)
            raindrop.draw();

        

        for (const tree of TreeList)
            tree.draw_branch();

        if (Config.drawLeaf)
            for (const tree of TreeList)
                tree.draw_leaf();

        //draw_text(20,30,`Debug: object count: ${getTreeNodeCount()+RainDropList.length}`,30);

        let _dt= Date.now()-_timeStart;
        if (_dt<Config.DT)
            await sleep(Config.DT-_dt);
    }
}

run();

document.getElementById('test_button').onclick= ()=>{
    TreeList.length= 0;

    for (let x= 100; x<canvas.width-50; x+=100)
        new Tree(x, 900, Data.DefaultData);
}

document.getElementById('test_button2').onclick= ()=>{
    TreeList.length= 0;

    for (let x= 100; x<canvas.width-50; x+=100)
        new Tree(x, 900, Data.SecondTree);
}


document.getElementById('test_button3').onclick= ()=>{
    TreeList.length= 0;

    for (let x= 100; x<canvas.width-50; x+=100)
        new Tree(x, 900, Data.ThirdTree);
}

let rainInterval= null;
document.getElementById('rain_button').onclick= ()=>{
    if (rainInterval===null){
        rainInterval= setInterval(()=>{
            let rainDensity= 10;
            let _range= Math.ceil(Config.canvasWidth/rainDensity);
            for (let x= 0; x<Config.canvasWidth; x+=_range+1)
                new RainDrop(randint(x,x+_range),0,-10,30);
        },Config.DT);
    }
    else{
        clearInterval(rainInterval);
        rainInterval= null;
    }
}
