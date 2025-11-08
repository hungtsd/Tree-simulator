console.log('JS file loaded!');
import * as Data from './data.js';
import * as Config from './config.js';
import * as Helper from './helper.js';

const rain_activation_button= document.getElementById('rain_button');
const rain_intensity_input= document.getElementById('rain_intensity_input');
const rain_intensity_response= document.getElementById('rain_intensity_response');
const wind_activation_button= document.getElementById('wind_button');
const wind_intensity_input= document.getElementById('wind_intensity_input');
const wind_intensity_response= document.getElementById('wind_intensity_response');

const canvas_main= document.getElementById('canvas_main');
const ctx_main= canvas_main.getContext('2d');
const canvas_stat= document.getElementById('canvas_stat');
const ctx_stat= canvas_stat.getContext('2d');

canvas_main.width= Config.canvasMainWidth;
canvas_main.height=Config.canvasMainHeight;
canvas_stat.width= Config.canvasStatWidth;
canvas_stat.height=Config.canvasStatHeight;

ctx_main.lineCap= 'round';

function draw_circle(ctx,x,y,r,col_inner){
    ctx.beginPath();
    ctx.arc(x,y,r,0,2*Math.PI);

    ctx.fillStyle= col_inner;
    ctx.fill();
}

function draw_line(ctx,x1,y1,x2,y2,col,width){
    ctx.strokeStyle= col;
    ctx.lineWidth= width;

    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
}

function draw_text(ctx,x,y,text,size){
    ctx.font= `${size}px Arial`;
    ctx.fillStyle=`black`;
    ctx.fillText(text,x,y);
}

function clear_canvas(ctx, height, width){
    ctx.fillStyle=`lightblue`;
    ctx.fillRect(0,0,width,height);
}

class TreeNode{
    constructor(rel_angle, length, parent, data, nodeList, isroot=false){
        this.x= 0;
        this.y= 0;

        this.d_angle=0;
        this.d_angle_speed=0;
        this.rel_angle= rel_angle;
        this.abs_angle= rel_angle+parent.abs_angle;
        this.length= length;

        this.isroot= isroot;
        this.data= data;
        this.parent= parent;
        this.child= [];
        nodeList.push(this);
    }

    async grow(nodeList, leafList, countminimum, countLimit, ChildChance=this.data.ChildChance, StopChance=this.data.StopChance){
        if (!(nodeList.length<countminimum) && (nodeList.length>=countLimit || Helper.testChance(StopChance))){
            leafList.push(this);
            this.leafRadius= Helper.randint(this.data.MinLeafRadius,this.data.MaxLeafRadius);
            return;
        }

        this.child.push(new TreeNode(Helper.randint(0, this.data.FirstChildMaxAngle)*Helper.randsign(),
                                     Helper.randint(this.data.MinLength, this.data.MaxLength),
                                     this,
                                     this.data,
                                     nodeList));

        while (this.child.length<this.data.MaxChild && nodeList.length<countLimit && Helper.testChance(ChildChance))

            this.child.push(new TreeNode(Helper.randint(this.data.ChildMinAngle, this.data.ChildMaxAngle)*Helper.randsign(),
                                         Helper.randint(this.data.MinLength, this.data.MaxLength),
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
        this.x= this.parent.x + Math.round(this.length*Math.cos(Helper.to_rad(this.abs_angle)));
        this.y= this.parent.y - Math.round(this.length*Math.sin(Helper.to_rad(this.abs_angle)));
    }

    draw_branch(){
        if (this.parent===null)
            return;
        draw_line(ctx_main,this.x,this.y,this.parent.x,this.parent.y,this.data.BranchCol,this.data.Diameter);
    }

    draw_leaf(){
        draw_circle(ctx_main,this.x,this.y,this.leafRadius,this.data.LeafCol);
        let _offSet= Math.floor(this.leafRadius/2);
        //để như này cho đẹp :)))
        draw_circle(ctx_main,this.x-_offSet-5,this.y+_offSet-5,this.leafRadius-_offSet+5,this.data.LeafCol);
        draw_circle(ctx_main,this.x+_offSet+5,this.y+_offSet-5,this.leafRadius-_offSet+5,this.data.LeafCol);
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

        this.boundingBox= Helper.get_boundingBox(...this.nodeList);
    }

    draw_branch(){
        for (const node of this.nodeList)
            node.draw_branch();

        if (!Config.drawRoot)
            return;
        for (let offSet= -Math.ceil(this.data.NodeData.Diameter/2); offSet<=this.data.NodeData.Diameter/2; offSet+=this.data.NodeData.Diameter)
            draw_line(ctx_main,this.x+offSet, this.y+10, this.x, this.y-10, this.data.NodeData.BranchCol, this.data.NodeData.Diameter);
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
        let _boundingBox= Helper.get_boundingBox(_cord,_lastCord);

        for (const tree of TreeList){
            if (!Helper.collision_box(_boundingBox, tree.boundingBox))
                continue;

            for (const node of tree.nodeList){
                if (node.parent===null) continue;
                if (Helper.collision_line(_lastCord, _cord, node, node.parent)){
                    this.exist= false;
                    node.d_angle_speed-=5*Helper.get_direction(node, node.parent, _lastCord);
                    
                    if (Config.drawRainDropCollision)
                        draw_circle(ctx_main,this.x, this.y, 15, 'red');

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
        console.log('Drawing');
        draw_line(ctx_main,this.x-this.sx, this.y-this.sy, this.x, this.y, 'blue', 1);
    }
}

document.getElementById('test_button').onclick= ()=>{
    TreeList.length= 0;

    for (let x= 100; x<canvas_main.width-50; x+=100)
        new Tree(x, 900, Data.DefaultData);
}

document.getElementById('test_button2').onclick= ()=>{
    TreeList.length= 0;

    for (let x= 100; x<canvas_main.width-50; x+=100)
        new Tree(x, 900, Data.SecondTree);
}


document.getElementById('test_button3').onclick= ()=>{
    TreeList.length= 0;

    for (let x= 100; x<canvas_main.width-50; x+=100)
        new Tree(x, 900, Data.ThirdTree);
}

let rain_enabled= false, wind_enabled= false, rain_intensity= 1, wind_intensity= 1;
rain_activation_button.onclick= ()=>{
    if (rain_enabled){
        rain_enabled= false;
        rain_intensity_input.disabled= true;
        rain_activation_button.textContent= 'Bật mưa';
    }
    else{
        rain_enabled= true;
        rain_intensity_input.disabled= false;
        rain_activation_button.textContent= 'Tắt mưa';
    }
}

rain_intensity_input.addEventListener('input', (event)=>{
    let _input= rain_intensity_input.value;
    if (_input==='') _input= '1';
    if (!(Helper.is_a_number(_input) && Number(_input)>0)){
        rain_intensity_input.style.borderBottomColor= 'red';
        return;
    }
    rain_intensity_input.style.borderBottomColor= 'lime';
    rain_intensity= Number(_input);
})

let _temp_rain_count= 0;

async function run(){
    while (true){
        let _timeStart= Date.now();

        if (Config.clearCanvas)
            clear_canvas(ctx_main, Config.canvasMainHeight, Config.canvasMainWidth);
        clear_canvas(ctx_stat, Config.canvasStatHeight, Config.canvasStatWidth);

        if (rain_enabled){
            let _temp= rain_intensity/100;
            _temp_rain_count+= _temp;
            while (_temp_rain_count>=1){
                new RainDrop(Helper.randint(0,Config.canvasMainWidth), 0, -10, 30);
                _temp_rain_count--;
            }
        }

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

        let _obj_count= RainDropList.length;
        for (const tree of TreeList)
            _obj_count+= tree.nodeList.length;
        draw_text(ctx_stat,20,60,`Debug: object count: ${_obj_count}`,60);

        let _dt= Date.now()-_timeStart;
        if (_dt<Config.DT)
            await Helper.sleep(Config.DT-_dt);
    }
}

run();