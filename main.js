console.log('JS file loaded!');
import * as Data from './data.js';
import * as LevelData from './level_data.js';
import * as Config from './config.js';
import * as Helper from './helper.js';
import * as Draw from './draw.js';

const rain_activation_button= document.getElementById('rain_button');
const rain_intensity_input= document.getElementById('rain_intensity_input');
const rain_intensity_response= document.getElementById('rain_intensity_response');
const wind_activation_button= document.getElementById('wind_button');
const wind_intensity_input= document.getElementById('wind_intensity_input');
const wind_intensity_response= document.getElementById('wind_intensity_response');

const tree_button_list=[
    document.getElementById('tree_empty_button'),
    document.getElementById('tree_column_button'),
    document.getElementById('tree_layered_button'),
    document.getElementById('tree_cone_button'),
    document.getElementById('tree_spread_button'),
    document.getElementById('tree_mix_button')
]

const density_button_list=[
    document.getElementById('low_density_button'),
    document.getElementById('medium_density_button'),
    document.getElementById('high_density_button')
];

const canvas_main= document.getElementById('canvas_main');
const ctx_main= canvas_main.getContext('2d');
const canvas_stat= document.getElementById('canvas_stat');
const ctx_stat= canvas_stat.getContext('2d');

canvas_main.width= Config.canvasMainWidth;
canvas_main.height=Config.canvasMainHeight;
canvas_stat.width= Config.canvasStatWidth;
canvas_stat.height=Config.canvasStatHeight;

ctx_main.lineCap= 'round';

let DensityLevel= 0;
let TreeType= 0;

class TreeNode{
    constructor(rel_angle, parent, data, nodeList){
        this.x= 0;
        this.y= 0;

        this.d_angle=0;
        this.d_angle_speed=0;
        this.rel_angle= rel_angle;
        this.abs_angle= this.rel_angle+parent.abs_angle;

        
        if (this.abs_angle<0 || this.abs_angle>1800){
            this.rel_angle= -this.rel_angle;
            this.abs_angle= this.rel_angle+parent.abs_angle;
        }
        
        this.leafCollisionPoint1= {x: 0, y:0};
        this.leafCollisionPoint2= {x: 0, y:0};
        this.data= data;
        this.length= Helper.randint(this.data.MinLength, this.data.MaxLength);
        this.parent= parent;
        nodeList.push(this);

        this.waterAmount= 0;
        this.toughness= this.data.LeafToughness;
    }

    get_toughness(child){
        this.toughness= Math.max(this.toughness, child.toughness+this.data.ToughnessPerNode);
    }

    async grow(nodeList, leafList, isMainBranch=true, height=1){
        if (nodeList.length>=this.data.MaxNodeCount || (height>=this.data.MaxHeight || (height>=this.data.MinHeight && Helper.testChance(this.data.StopChance)))){
            leafList.push(this);
            this.leafRadius= Helper.randint(this.data.MinLeafRadius,this.data.MaxLeafRadius);
            return;
        }

        let _child= new TreeNode(Helper.randint(0, this.data.FirstChildMaxAngle)*Helper.randsign(),
                                 this,
                                 this.data,
                                 nodeList);

        _child.grow(nodeList, leafList, isMainBranch, height+1)
        
        this.get_toughness(_child);

        let _childCount= 1;
        
        if (!(!isMainBranch && !this.data.ComplexChild) && height>=this.data.ChildStart)
            while (_childCount<this.data.MaxChild && nodeList.length<this.data.MaxNodeCount && Helper.testChance(this.data.ChildChance)){
                
                let _angle= Helper.randint(this.data.ChildMinAngle, this.data.ChildMaxAngle)*Helper.randsign();
                _child= new TreeNode(_angle,
                                     this,
                                     this.data,
                                     nodeList);
                _child.grow(nodeList, leafList, false, height+this.data.HeightInc)
                this.get_toughness(_child);
                _childCount++;
                
                if (!isMainBranch || !this.data.ChildSymmetry) continue;
                
                _child= new TreeNode(-_angle,
                                     this,
                                     this.data,
                                     nodeList);
                _child.grow(nodeList, leafList, false, height+this.data.HeightInc)
                this.get_toughness(_child);
                _childCount++;
            }
    }

    update(){
        this.d_angle+= this.d_angle_speed;
        this.d_angle_speed= Math.trunc(this.d_angle_speed*0.8);
        this.d_angle= Math.trunc(this.d_angle*0.8);

        this.abs_angle= this.parent.abs_angle + this.rel_angle + this.d_angle;
        this.x= this.parent.x + Math.round(this.length*Math.cos(Helper.to_rad(this.abs_angle)));
        this.y= this.parent.y - Math.round(this.length*Math.sin(Helper.to_rad(this.abs_angle)));

        let _waterFlow= Math.ceil(this.waterAmount/1000);
        this.waterAmount-= _waterFlow;
        this.parent.waterAmount+= _waterFlow;
    }

    update_leaf_collision_cords(){
        const _length= this.leafRadius;
        this.leafCollisionPoint1= {
            x: Math.round(this.x-_length*Math.sin(Helper.to_rad(this.abs_angle))),
            y: Math.round(this.y-_length*Math.cos(Helper.to_rad(this.abs_angle)))
        };
        this.leafCollisionPoint2= {
            x: Math.round(this.x+_length*Math.sin(Helper.to_rad(this.abs_angle))),
            y: Math.round(this.y+_length*Math.cos(Helper.to_rad(this.abs_angle)))
        };
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

        //Draw.line(ctx_main, this.leafCollisionPoint1.x, this.leafCollisionPoint1.y, this.leafCollisionPoint2.x, this.leafCollisionPoint2.y, 'green', 10);
    }
}

let TreeList=[], RainDropList=[], AirMoleculeList= [];

let rainCount= 0, rainHitCount= 0, rainAbsorbed= 0, windCount= 0, windSpeedSum= 0;

class Tree{
    constructor(x, type){
        this.x= x;
        this.y= Config.terrainGet(x);

        this.abs_angle=900;

        if (DensityLevel==0) this.data= type.LowDensity;
        else if (DensityLevel==1) this.data= type.MediumDensity
        else this.data= type.HighDensity;

        this.nodeList= [];
        this.leafList= [];
        
        this.root= new TreeNode(0, this, this.data, this.nodeList);
        this.root.grow(this.nodeList, this.leafList);

        this.boundingBox= null;
        this.update();

        TreeList.push(this);

        this.waterAmount= 0;
    }

    update(){

        for (const node of this.nodeList)
            node.update();

        for (const node of this.leafList)
            node.update_leaf_collision_cords();

        this.boundingBox= Helper.get_boundingBox(...this.nodeList, ...this.leafList.flatMap(node => [node.leafCollisionPoint1, node.leafCollisionPoint2]));
    }

    draw_branch(){
        for (const node of this.nodeList)
            node.draw_branch();

        if (!Config.drawRoot)
            return;
        for (let offSet= -Math.ceil(this.data.Diameter/2); offSet<=this.data.Diameter/2; offSet+=this.data.Diameter)
            Draw.line(ctx_main,this.x+offSet, this.y+10, this.x, this.y-20, this.data.BranchCol, this.data.Diameter);
    }

    draw_leaf(){
        for (const node of this.leafList)
            node.draw_leaf();
    }
}

class RainDrop{
    constructor(x, y, sx, sy, vol){
        this.x= x;
        this.y= y;
        this.sx= sx;
        this.sy= sy;
        this.vol= vol;
        this.force= vol*200;
        this.thickness= Math.min(Math.ceil(vol*10),5);
        this.exist= true;

        RainDropList.push(this);
    }

    update(){
        let _lastCord= {x: this.x, y:this.y};

        this.x+= this.sx;
        this.y+= this.sy;

        if (_lastCord.y>Config.terrainGet(this.x)+15){
            this.exist= false;
            rainAbsorbed+= this.vol;
            rainCount++;
            rainHitCount++;
            return;
        }
        
        let _cord= {x: this.x, y:this.y};
        let _boundingBox= Helper.get_boundingBox(_cord,_lastCord);
        
        for (const tree of TreeList){
            if (!Helper.collision_box(_boundingBox, tree.boundingBox))
                continue;

            for (const node of tree.leafList){
                if (Helper.testChance(0.5) && Helper.collision_line(_lastCord, _cord, node.leafCollisionPoint1, node.leafCollisionPoint2)){
                    this.exist= false;
                    node.d_angle_speed+=Math.round(this.force/node.toughness)*Helper.get_direction(node, node.parent, _cord);

                    node.waterAmount+=this.vol;
                    rainCount++;
                    
                    if (Config.drawRainDropCollision)
                        Draw.circle(ctx_main,this.x, this.y, 15, 'red');

                    return;
                }
            }

            for (const node of tree.nodeList){
                if (node.parent===null) continue;
                if (Helper.collision_line(_lastCord, _cord, node, node.parent)){
                    this.exist= false;
                    node.d_angle_speed-=Math.round(this.force/node.toughness)*Helper.get_direction(node, node.parent, _lastCord);

                    node.waterAmount+=this.vol;
                    rainCount++;
                    
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
        Draw.line(ctx_main,this.x-this.sx, this.y-this.sy, this.x, this.y, 'blue', this.thickness);
    }
}

class AirMolecule{
    constructor(x, py, sx){
        this.x= x;
        this.py= py;
        this.y= Math.round(Config.terrainGet(this.x)*this.py);
        this.sx= sx;
        this.exist= true;
        this.collided= false;

        AirMoleculeList.push(this);
    }

    update(){
        let _lastCord= {x:this.x, y:this.y};

        this.x+= this.sx;
        this.y= Math.round(Config.terrainGet(this.x)*this.py);

        if (Math.abs(this.sx)<0.5 || this.x<0){
            this.exist= false;

            if (this.collided || TreeType==0){
                windCount++;
                windSpeedSum+= Math.abs(this.sx);
            }

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
                    node.d_angle_speed-=Math.round(Math.abs(this.sx)*5/node.toughness)*Helper.get_direction(node, node.parent, _lastCord);

                    this.sx*= 0.9;

                    this.collided= true;
                }
            }
        }
    }

    draw(){
        if (Config.drawAirMolecule)
            Draw.circle(ctx_main, this.x, this.y, 3, 'red');
    }
}

function create_tree(){
    let xstep= 100;
    switch(DensityLevel){
        case 0:
            xstep = 200;
            break;
        case 1:
            xstep = 125;
            break;
        case 2:
            xstep = 75;
    }

    TreeList.length= 0;
    let typeData= null;

    switch(TreeType){
        case 0:
            return;
        case 1:
            typeData= Data.Column;
            break;
        case 2:
            typeData= Data.Layered;
            break;
        case 3:
            typeData= Data.Cone;
            break;
        case 4:
            typeData= Data.Spread;
            break;
        
        case 5:
            for (let x=100; x<=canvas_main.width-100; x+=xstep*4)
                new Tree(x, Data.Column);
            for (let x=100+xstep; x<=canvas_main.width-100; x+=xstep*4)
                new Tree(x, Data.Layered);
            for (let x=100+xstep*2; x<=canvas_main.width-100; x+=xstep*4)
                new Tree(x, Data.Cone);
            for (let x=100+xstep*3; x<=canvas_main.width-100; x+=xstep*4)
                new Tree(x, Data.Spread);
    }

    
    for (let x=100; x<=canvas_main.width-100; x+=xstep)
        new Tree(x, typeData);
}

for (let i=0; i<tree_button_list.length; i++){
    tree_button_list[i].onclick= (event)=>{
        TreeType= i;

        for (const _button of tree_button_list)
            _button.classList.remove('activating');
        event.currentTarget.classList.add('activating');

        create_tree();
    }
}

for (let i=0; i<density_button_list.length; i++){
    density_button_list[i].onclick= (event)=>{
        DensityLevel= i;

        for (const _button of density_button_list)
            _button.classList.remove('activating');
        event.currentTarget.classList.add('activating');

        create_tree();
    }
}

function validate_input(input, minVal, currVal, level_data, responseElement){
    let _inputVal= input.value;
    if (_inputVal==='') _inputVal= String(minVal);
    if (!(Helper.is_a_number(_inputVal) && Number(_inputVal)>=minVal)){
        input.style.borderBottomColor= 'red';
        return currVal;
    }
    input.style.borderBottomColor= 'lime';

    _inputVal= Number(_inputVal);
    for (const _data of level_data){
        if (_inputVal>_data.MaxLevel) continue;
        responseElement.textContent= _data.Text;
        responseElement.style.color= _data.Color;
        break;
    }

    return _inputVal;
}

let rain_enabled= false, wind_enabled= false, rain_intensity= 1, wind_intensity= 0;
rain_activation_button.onclick= ()=>{
    if (rain_enabled){
        rain_enabled= false;
        rain_activation_button.textContent= 'Bật mưa';
        rain_activation_button.classList.remove('activating');
        rain_intensity= 0;
        rain_intensity_response.textContent= '---';
        rain_intensity_response.style.color= 'black';
    }
    else{
        rain_enabled= true;
        rain_activation_button.textContent= 'Tắt mưa';
        rain_activation_button.classList.add('activating');
        rain_intensity= validate_input(rain_intensity_input, 1, rain_intensity, LevelData.RainData, rain_intensity_response);
    }
}

rain_intensity_input.addEventListener('input', ()=>{
    rain_intensity= validate_input(rain_intensity_input, 1, rain_intensity, LevelData.RainData, rain_intensity_response);
});

wind_activation_button.onclick= ()=>{
    if (wind_enabled){
        wind_enabled= false;
        wind_activation_button.textContent= 'Bật gió';
        wind_activation_button.classList.remove('activating');
        wind_intensity= 0;
        wind_intensity_response.textContent= '---';
        wind_intensity_response.style.color= 'black';
    }
    else{
        wind_enabled= true;
        wind_activation_button.textContent= 'Tắt gió';
        wind_activation_button.classList.add('activating');
        wind_intensity= validate_input(wind_intensity_input, 5, wind_intensity, LevelData.WindData, wind_intensity_response);
    }
}

wind_intensity_input.addEventListener('input', ()=>{
    wind_intensity= validate_input(wind_intensity_input, 5, wind_intensity, LevelData.WindData, wind_intensity_response);
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

let objCount_display= new statDisplay(50,100,100,'Object count: ','', new predictVal);
let rainVolume_display= new statDisplay(50,350,100,'Lượng mưa: ',' ml/s', new avgVal, 2);
let rainTF_display= new statDisplay(50,450,100, 'Tỉ lệ nước bị chắn: ', '%', new avgVal, 1);
let windSpeed_display= new statDisplay(50,550,100,'Tốc độ gió: ','km/h', new avgVal, 2);
let fps_display= new statDisplay(50,700,100,'',' FPS', new predictVal(0.1, 60), 1);
let frameCount= 0;

function spawnRainDrop(accumulate){
    let windSpeed= 0;
    if (wind_enabled) windSpeed= Helper.kmh_to_pxf(wind_intensity);

    let dropCount= Helper.mm24h_to_rpf(rain_intensity),
        dropVolume= Config.rainDropNormalVolume;
    if (dropCount>Config.rainDropCap){
        dropVolume= Helper.mm24h_to_vol(rain_intensity);
        dropCount=  Config.rainDropCap;
    }
    dropCount+= accumulate;
    while (dropCount>=1){
        new RainDrop(Helper.randint(-100,Config.canvasMainWidth+100),0,-windSpeed, 15, dropVolume);
        --dropCount;
    }
    return dropCount;
}

function spawnAirMolecule(accumulate){
    let windSpeed= Helper.kmh_to_pxf(wind_intensity);
    accumulate+= 0.5;
    while (accumulate>=1){
        new AirMolecule(Config.canvasMainWidth, Math.random(), -windSpeed);
        accumulate--;
    }
    return accumulate;
}

async function run(){
    let rainDropLast= 0, airMoleculeLast= 0;

    while (true){
        let _timeStart= Date.now();

        if (Config.clearCanvas)
            Draw.clear_canvas(ctx_main, Config.canvasMainHeight, Config.canvasMainWidth);
        Draw.clear_canvas(ctx_stat, Config.canvasStatHeight, Config.canvasStatWidth);

        if (rain_enabled)
            rainDropLast= spawnRainDrop(rainDropLast);

        if (wind_enabled)
            airMoleculeLast= spawnAirMolecule(airMoleculeLast);

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

        Draw.draw_terrain(ctx_main);

        let _obj_count= RainDropList.length+AirMoleculeList.length;
        for (const tree of TreeList)
            _obj_count+= tree.nodeList.length;
        objCount_display.updateValue(_obj_count);

        for (const tree of TreeList){
            rainAbsorbed+= tree.waterAmount;
            tree.waterAmount= 0;
        }

        if (rainCount==0) rainTF_display.updateValue(0);
        else rainTF_display.updateValue((rainCount-rainHitCount)/rainCount*100);
        rainVolume_display.updateValue(rainAbsorbed*60);
        rainAbsorbed= 0;
        rainCount=0;
        rainHitCount=0;

        if (windCount!=0) windSpeed_display.updateValue(Helper.pxf_to_kmh(windSpeedSum/windCount));
        else if (!wind_enabled) windSpeed_display.updateValue(0); //còn cách sửa nào hay hơn ko :(
        windCount= 0;
        windSpeedSum= 0;

        //objCount_display.draw();
        rainVolume_display.draw();
        rainTF_display.draw();
        windSpeed_display.draw();
        //fps_display.draw();

        frameCount++;

        //Draw.line(ctx_main, 50, Config.terrainGet(50), 50, Config.terrainGet(50)-50, 'black', 10);

        let _dt= Date.now()-_timeStart;
        if (_dt<Config.DT)
            await Helper.sleep(Config.DT-_dt);
    }
}

let lastRealTime= Date.now();
function run_stat(){

    fps_display.updateValue(frameCount*1000/(Date.now()-lastRealTime));
    frameCount= 0;
    lastRealTime= Date.now();

    objCount_display.updateDisplay();
    rainVolume_display.updateDisplay();
    rainTF_display.updateDisplay();
    windSpeed_display.updateDisplay();
    fps_display.updateDisplay();
}

run();
setInterval(run_stat, Config.statUpdateInterval);
