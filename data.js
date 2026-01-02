export const Column={
    
    LowDensity: {
        Diameter: 12,
        MinLeafRadius: 30,
        MaxLeafRadius: 50,
        BranchCol: 'brown',
        LeafCol: 'green',
        MinLength: 30,
        MaxLength: 40,
        LeafToughness: 1,
        ToughnessPerNode: 0.5,

        FirstChildMaxAngle: 30,
        ChildMinAngle: 300,
        ChildMaxAngle: 450,

        MaxChild: 2,
        ChildChance: 0.75,
        ChildSymmetry: false,
        ComplexChild: true,
        HeightInc: 2,
        ChildStart: 5,
        MinHeight: 10,
        MaxHeight: 12,
        StopChance: 0.5,
        MaxNodeCount: 30
    },

    MediumDensity: {
        Diameter: 10,
        MinLeafRadius: 30,
        MaxLeafRadius: 35,
        BranchCol: 'brown',
        LeafCol: 'green',
        MinLength: 45,
        MaxLength: 55,
        LeafToughness: 1,
        ToughnessPerNode: 0.4,

        FirstChildMaxAngle: 20,
        ChildMinAngle: 200,
        ChildMaxAngle: 300,

        MaxChild: 2,
        ChildChance: 0.75,
        ChildSymmetry: false,
        ComplexChild: true,
        ChildStart: 4,
        HeightInc: 2,
        MinHeight: 7,
        MaxHeight: 9,
        StopChance: 0.3,
        MaxNodeCount: 20
    },

    HighDensity: {
        Diameter: 8,
        MinLeafRadius: 30,
        MaxLeafRadius: 35,
        BranchCol: 'brown',
        LeafCol: 'green',
        MinLength: 60,
        MaxLength: 80,
        LeafToughness: 1,
        ToughnessPerNode: 0.5,

        FirstChildMaxAngle: 20,
        ChildMinAngle: 200,
        ChildMaxAngle: 250,

        MaxChild: 2,
        ChildChance: 0.5,
        ChildSymmetry: false,
        ComplexChild: true,
        HeightInc: 3,
        ChildStart: 4,
        MinHeight: 5,
        MaxHeight: 7,
        StopChance: 0.3,
        MaxNodeCount: 12
    }
}

export const Layered={
    
    LowDensity: {
        Diameter: 12,
        MinLeafRadius: 20,
        MaxLeafRadius: 30,
        BranchCol: 'brown',
        LeafCol: 'green',
        MinLength: 55,
        MaxLength: 65,
        LeafToughness: 1,
        ToughnessPerNode: 0.5,

        FirstChildMaxAngle: 30,
        ChildMinAngle: 300,
        ChildMaxAngle: 450,

        MaxChild: 2,
        ChildChance: 0.9,
        ChildSymmetry: true,
        ComplexChild: true,
        HeightInc: 5,
        ChildStart: 1,
        MinHeight: 5,
        MaxHeight: 7,
        StopChance: 0.5,
        MaxNodeCount: 30
    },

    MediumDensity: {
        Diameter: 10,
        MinLeafRadius: 20,
        MaxLeafRadius: 30,
        BranchCol: 'brown',
        LeafCol: 'green',
        MinLength: 60,
        MaxLength: 70,
        LeafToughness: 1,
        ToughnessPerNode: 0.5,

        FirstChildMaxAngle: 30,
        ChildMinAngle: 250,
        ChildMaxAngle: 350,

        MaxChild: 2,
        ChildChance: 0.75,
        ChildSymmetry: true,
        ComplexChild: true,
        HeightInc: 5,
        ChildStart: 2,
        MinHeight: 4,
        MaxHeight: 6,
        StopChance: 0.3,
        MaxNodeCount: 20
    },

    HighDensity: {
        Diameter: 8,
        MinLeafRadius: 20,
        MaxLeafRadius: 30,
        BranchCol: 'brown',
        LeafCol: 'green',
        MinLength: 60,
        MaxLength: 80,
        LeafToughness: 1,
        ToughnessPerNode: 0.3,

        FirstChildMaxAngle: 20,
        ChildMinAngle: 250,
        ChildMaxAngle: 350,

        MaxChild: 2,
        ChildChance: 0.5,
        ChildSymmetry: true,
        ComplexChild: true,
        HeightInc: 5,
        ChildStart: 3,
        MinHeight: 4,
        MaxHeight: 6,
        StopChance: 0.3,
        MaxNodeCount: 12
    }
}

export const Cone={
    
    LowDensity: {
        Diameter: 12,
        MinLeafRadius: 20,
        MaxLeafRadius: 30,
        BranchCol: 'brown',
        LeafCol: 'green',
        MinLength: 40,
        MaxLength: 50,
        LeafToughness: 1,
        ToughnessPerNode: 0.4,

        FirstChildMaxAngle: 15,
        ChildMinAngle: 550,
        ChildMaxAngle: 650,

        MaxChild: 2,
        ChildChance: 0.9,
        ChildSymmetry: true,
        ComplexChild: false,
        HeightInc: 3,
        ChildStart: 3,
        MinHeight: 6,
        MaxHeight: 8,
        StopChance: 0.5,
        MaxNodeCount: 30
    },

    MediumDensity: {
        Diameter: 10,
        MinLeafRadius: 20,
        MaxLeafRadius: 30,
        BranchCol: 'brown',
        LeafCol: 'green',
        MinLength: 50,
        MaxLength: 70,
        LeafToughness: 1,
        ToughnessPerNode: 0.4,

        FirstChildMaxAngle: 15,
        ChildMinAngle: 550,
        ChildMaxAngle: 650,

        MaxChild: 2,
        ChildChance: 0.75,
        ChildSymmetry: true,
        ComplexChild: false,
        HeightInc: 3,
        ChildStart: 3,
        MinHeight: 5,
        MaxHeight: 7,
        StopChance: 0.5,
        MaxNodeCount: 20
    },

    HighDensity: {
        Diameter: 8,
        MinLeafRadius: 20,
        MaxLeafRadius: 30,
        BranchCol: 'brown',
        LeafCol: 'green',
        MinLength: 60,
        MaxLength: 80,
        LeafToughness: 1,
        ToughnessPerNode: 0.4,

        FirstChildMaxAngle: 15,
        ChildMinAngle: 400,
        ChildMaxAngle: 500,

        MaxChild: 2,
        ChildChance: 0.75,
        ChildSymmetry: true,
        ConplexChild: false,
        HeightInc: 3,
        ChildStart: 3,
        MinHeight: 5,
        MaxHeight: 7,
        StopChance: 0.5,
        MaxNodeCount: 12
    }
}