console.log('JS file loaded!');
import * as Data from './data.js';
import * as Config from './config.js';
import * as Helper from './helper.js';
import * as Draw from './draw.js';

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
        Draw.line(ctx_main,this.x,this.y,this.parent.x,this.parent.y,this.data.BranchCol,this.data.Diameter);
    }

    draw_leaf(){
        Draw.circle(ctx_main,this.x,this.y,this.leafRadius,this.data.LeafCol);
        let _offSet= Math.floor(this.leafRadius/2);
        //để như này cho đẹp :)))
        Draw.circle(ctx_main,this.x-_offSet-5,this.y+_offSet-5,this.leafRadius-_offSet+5,this.data.LeafCol);
        Draw.circle(ctx_main,this.x+_offSet+5,this.y+_offSet-5,this.leafRadius-_offSet+5,this.data.LeafCol);
    }
}

let TreeList=[], RainDropList=[], AirMoleculeList= [];
let _temp_rain_output= 0;

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

        this.boundingBox= null;
        this.raindropCount= 0;
        this.update();

        TreeList.push(this);
    }

    update(){

        for (const node of this.nodeList)
            node.update();

        this.boundingBox= Helper.get_boundingBox(...this.nodeList);

        if (this.raindropCount>0){
            let _raindrop_loss= Math.ceil(this.raindropCount/10);
            _temp_rain_output+= _raindrop_loss;
            this.raindropCount-= _raindrop_loss;
        }
    }

    draw_branch(){
        for (const node of this.nodeList)
            node.draw_branch();

        if (!Config.drawRoot)
            return;
        for (let offSet= -Math.ceil(this.data.NodeData.Diameter/2); offSet<=this.data.NodeData.Diameter/2; offSet+=this.data.NodeData.Diameter)
            Draw.line(ctx_main,this.x+offSet, this.y+10, this.x, this.y-10, this.data.NodeData.BranchCol, this.data.NodeData.Diameter);
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

        if (_lastCord.y>1000){
            this.exist= false;
            _temp_rain_output++;
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

                    tree.raindropCount++;
                    
                    if (Config.drawRainDropCollision)
                        Draw.circle(ctx_main,this.x, this.y, 15, 'red');

                    return;
                }
            }
        }
        if ((_lastCord.x<0 && this.sx<0) || (_lastCord.x>Config.canvasMainWidth && this.sx>0))
            this.x= Config.canvasMainWidth-this.x;
    }

    draw(){
        Draw.line(ctx_main,this.x-this.sx, this.y-this.sy, this.x, this.y, 'blue', 1);
    }
}

class AirMolecule{
    constructor(x, y, sx, sy){
        this.x= x;
        this.y= y;
        this.sx= sx;
        this.sy= sy;
        this.exist= true;

        AirMoleculeList.push(this);
    }

    update(){
        let _lastCord= {x:this.x, y:this.y};

        this.x+= this.sx;
        this.y+= this.sy;

        if ((Math.abs(this.sx)<1 && Math.abs(this.sy)<1 ) || this.x<0){
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
                    //this.exist= false;
                    node.d_angle_speed-=(Math.floor(Math.abs(this.sx)))*Helper.get_direction(node, node.parent, _lastCord);

                    this.sx*= 0.9;
                    this.sy*= 0.9;
                }
            }
        }
    }

    draw(){
        if (Config.drawAirMolecule)
            Draw.circle(ctx_main, this.x, this.y, 10, 'red');
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
        new Tree(x, 900, Data.FourthTree);
}

function validate_input(input, minVal, currVal){
    let inputVal= input.value;
    if (inputVal==='') inputVal= String(minVal);
    if (!(Helper.is_a_number(inputVal) && Number(inputVal)>=minVal)){
        input.style.borderBottomColor= 'red';
        return currVal;
    }
    input.style.borderBottomColor= 'lime';

    console.log(inputVal);
    return Number(inputVal);
}

let rain_enabled= false, wind_enabled= false, rain_intensity= 1, wind_intensity= 0, wind_speed= 0;
rain_activation_button.onclick= ()=>{
    if (rain_enabled){
        rain_enabled= false;
        rain_intensity_input.disabled= true;
        rain_activation_button.textContent= 'Bật mưa';
        rain_intensity= 0;
    }
    else{
        rain_enabled= true;
        rain_intensity_input.disabled= false;
        rain_activation_button.textContent= 'Tắt mưa';
        rain_intensity= validate_input(rain_intensity_input, 1, rain_intensity);
    }
}

rain_intensity_input.addEventListener('input', ()=>{
    rain_intensity= validate_input(rain_intensity_input, 1, rain_intensity);
});

wind_activation_button.onclick= ()=>{
    if (wind_enabled){
        wind_enabled= false;
        wind_intensity_input.disabled= true;
        wind_activation_button.textContent= 'Bật gió';
        wind_intensity= 0;
        wind_speed= 0;
    }
    else{
        wind_enabled= true;
        wind_intensity_input.disabled= false;
        wind_activation_button.textContent= 'Tắt gió';
        wind_intensity= validate_input(wind_intensity_input, 5, wind_intensity);
        wind_speed= Math.max(Math.ceil(wind_intensity*28/108), 1);
    }
}

wind_intensity_input.addEventListener('input', ()=>{
    wind_intensity= validate_input(wind_intensity_input, 5, wind_intensity);
    wind_speed= Math.max(Math.ceil(wind_intensity*28/108), 1);
});

class predictVal{
    constructor(old_proportion=0.5, default_val=0){
        this.proportion= old_proportion;
        this.default_val= default_val;
        this.val= default_val;
    }

    update(val){
        this.val= this.val*this.proportion + val*(1-this.proportion);
    }
    
    reset(){
        this.val= this.default_val;
    }
}

class avgVal{
    constructor(default_val=0){
        this.default_val= default_val;
        this.sum= default_val;
        this.val= default_val;
        this.history= new Helper.queue(default_val);
    }

    update(val){
        this.sum+= val;
        this.history.push(val);

        if (this.history.length()>Config.avgValperiod)
            this.sum-= this.history.pop();

        this.val= this.sum/this.history.length();
    }
    
    reset(){
        this.sum= this.default_val;
        this.val= this.default_val;
        this.history= new Helper.queue(this.default_val);
    }
}

class statDisplay{
    constructor(x, y, size, prefix, suffix, valObj, rounding=0){
        this.x= x;
        this.y= y;
        this.size= size;
        this.prefix= prefix;
        this.suffix= suffix;
        this.valObj= valObj;
        this.valDisplay= String(valObj.val);
        this.rounding= Math.pow(10,rounding);
    }

    updateValue(val){
        this.valObj.update(val);
    }

    updateDisplay(){
        this.valDisplay= String(Math.round(this.valObj.val*this.rounding)/this.rounding);
    }

    draw(){
        Draw.text(ctx_stat, this.x, this.y, this.prefix + this.valDisplay + this.suffix, this.size);
    }
}

async function run(){
    let _raindrop_count= 0, _airmolecule_count= 0;;
    let _displayUpdate_counter= 0;

    let _objCount_display= new statDisplay(20,60,60,'Object count: ',' object', new predictVal);
    let _rainOutput_display= new statDisplay(20,120,60,'Rain ouput: ','', new avgVal, 2);

    while (true){
        let _timeStart= Date.now();

        if (Config.clearCanvas)
            Draw.clear_canvas(ctx_main, Config.canvasMainHeight, Config.canvasMainWidth);
        Draw.clear_canvas(ctx_stat, Config.canvasStatHeight, Config.canvasStatWidth);

        if (rain_enabled){
            _raindrop_count+= rain_intensity/100;
            while (_raindrop_count>=1){
                new RainDrop(Helper.randint(0,Config.canvasMainWidth), 0, -wind_speed, 30);
                _raindrop_count--;
            }
        }

        if (wind_enabled){
            _airmolecule_count+= 0.5;
            while (_airmolecule_count>=1){
                new AirMolecule(Config.canvasMainWidth, Helper.randint(10,Config.canvasMainHeight-10), -wind_speed, 0);
                _airmolecule_count--;
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


        for (const airmolecule of AirMoleculeList)
            airmolecule.update();

        AirMoleculeList= AirMoleculeList.filter((obj)=>{
            return obj.exist===true;
        });

        for (const airmolecule of AirMoleculeList)
            airmolecule.draw();

        for (const tree of TreeList)
            tree.draw_branch();

        if (Config.drawLeaf)
            for (const tree of TreeList)
                tree.draw_leaf();

        let _obj_count= RainDropList.length+AirMoleculeList.length;
        for (const tree of TreeList)
            _obj_count+= tree.nodeList.length;
        _objCount_display.updateValue(_obj_count);

        _rainOutput_display.updateValue(_temp_rain_output);
        _temp_rain_output= 0;

        _displayUpdate_counter++;
        if (_displayUpdate_counter>= Config.statUpdateInterval){
            _displayUpdate_counter= 0;
            _objCount_display.updateDisplay();
            _rainOutput_display.updateDisplay();
        }

        _objCount_display.draw();
        _rainOutput_display.draw();

        let _dt= Date.now()-_timeStart;
        if (_dt<Config.DT)
            await Helper.sleep(Config.DT-_dt);
    }
}

run();