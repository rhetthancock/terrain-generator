class Terrain {
    constructor(detail, smoothness, blend) {
        this.noiseMap = new NoiseMap(detail, smoothness);
        this.colors = new NoiseMap(detail, blend);
        this.size = Math.pow(2, detail) + 1;
        this.genVertices();
        this.genFaces();
        this.pulldownEdges();
        this.genNormals();
    }
    genFaces() {
        this.faces = [];
        var current = 0;
        for(var i = 0; i < this.size - 1; i++) {
            for(var j = 0; j < this.size - 1; j++) {
                // Triangle 1
                this.faces[current++] = j + (i * this.size);
                this.faces[current++] = (j + 1) + (i * this.size);
                this.faces[current++] = (j + 1) + ((i + 1) * this.size);
                // Triangle 2
                this.faces[current++] = j + (i * this.size);
                this.faces[current++] = (j + 1) + ((i + 1) * this.size);
                this.faces[current++] = j + ((i + 1) * this.size);
            }
        }
    }
    genNormals() {
        this.normals = [];
        for(var y = 0; y < this.size; y++) {
            for(var x = 0; x < this.size; x++) {
                var target = this.getPoint(x, y);
                var top = this.getPoint(x, y - 1);
                var bottom = this.getPoint(x, y + 1);
                var left = this.getPoint(x - 1, y);
                var right = this.getPoint(x + 1, y);
                var vtop, vbot, hleft, hright, vert, horiz, cross, length;
                if(top == undefined) {
                    vtop = target;
                }
                else {
                    vtop = top;
                }
                if(bottom == undefined) {
                    vbot = target;
                }
                else {
                    vbot = bottom;
                }
                if(left == undefined) {
                    hleft = target;
                }
                else {
                    hleft = left;
                }
                if(right == undefined) {
                    hright = target;
                }
                else {
                    hright = right;
                }
                vert = [
                    vbot[0] - vtop[0],
                    vbot[1] - vtop[1],
                    vbot[2] - vtop[2]]
                ;
                horiz = [
                    hright[0] - hleft[0],
                    hright[1] - hleft[1],
                    hright[2] - hleft[2]
                ];
                cross = [
                    vert[1] * horiz[2] - vert[2] * horiz[1],
                    vert[2] * horiz[0] - vert[0] * horiz[2],
                    vert[0] * horiz[1] - vert[1] * horiz[0]
                ];
                length = Math.sqrt(
                    cross[0] * cross[0] +
                    cross[1] * cross[1] +
                    cross[2] * cross[2]
                );
                this.normals.push(cross[0] / length);
                this.normals.push(cross[1] / length);
                this.normals.push(cross[2] / length);
            }
        }
    }
    genVertices() {
        this.vertices = [];
        var current = 0;
        var mcurrent = 0;
        for(var i = 0; i < this.size; i++) {
            for(var j = 0; j < this.size; j++) {
                this.vertices[current++] = (j / (this.size - 1) * 2) - 1; //x
                this.vertices[current++] = this.noiseMap.map[mcurrent++]; //y
                this.vertices[current++] = (i / (this.size - 1) * 2) - 1; //z
            }
        }
    }
    pulldown(index) {
        var setIndex = index * 3;
        this.vertices[setIndex + 1] = -0.25;
    }
    pulldownEdges() {
        for(var i = 0; i < this.size; i++) {
            this.pulldown(i);                               // Bottom
            this.pulldown(this.size * (this.size - 1) + i); // Top
            this.pulldown(this.size * i);                   // Left
            this.pulldown(this.size * i + (this.size - 1)); // Right
        }
        this.faces.push(0);
        this.faces.push(this.size - 1);
        this.faces.push(this.size * this.size - 1);
        this.faces.push(0);
        this.faces.push(this.size * this.size - 1);
        this.faces.push(this.size * (this.size - 1));
    }
    getPoint(x, y) {
        if(x >= 0 && x < this.size && y >= 0 && y < this.size) {
            var index = y * this.size + x;
            var setIndex = index * 3;
            return this.vertices.slice(setIndex, setIndex + 3);
        }
    }
}