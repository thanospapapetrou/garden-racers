'use strict';

class Garden {
    static #ATTRIBUTES = ['position', 'normal', 'textureCoordinatesCenter', 'textureCoordinatesN',
            'textureCoordinatesNE', 'textureCoordinatesE', 'textureCoordinatesSE', 'textureCoordinatesS',
            'textureCoordinatesSW', 'textureCoordinatesW', 'textureCoordinatesNW'];
    static #ERROR_LOADING = (url, status) => `Error loading garden ${url}: HTTP status ${status}`;
    static #IMAGE_TERRAINS = './img/terrains.png';
    static #SHADER_FRAGMENT = './glsl/garden.frag';
    static #SHADER_VERTEX = './glsl/garden.vert';
    static #STEP_LATTICE = 0.5;
    static #STEP_TEXTURE = 0.25;
    static #TEXTURE_TERRAINS = 0;
    static #UNIFORMS = ['projection', 'view', 'model', 'light.ambient', 'light.directional.color',
            'light.directional.direction', 'terrains'];

    #gl;
    #program;
    #terrains;
    #garden;
    #positionLattice;
    #normalLattice;
    #vao;
    #count;

    constructor(gl, url) {
        this.#gl = gl;
        return (async () => {
            this.#program = new Program(gl, await new Shader(gl, gl.VERTEX_SHADER, Garden.#SHADER_VERTEX),
                    await new Shader(gl, gl.FRAGMENT_SHADER, Garden.#SHADER_FRAGMENT), Garden.#UNIFORMS,
                    Garden.#ATTRIBUTES);
            this.#terrains = await new Texture(gl, Garden.#TEXTURE_TERRAINS, Garden.#IMAGE_TERRAINS);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(Shader.#ERROR_LOADING(url, response.status));
            }
            this.#garden = await response.json();
            this.#positionLattice = this.#calculatePositionLattice();
            this.#normalLattice = this.#calculateNormalLattice();
            this.#vao = new VertexArrayObject(gl, [ // TODO improve
                {vbo: new VertexBufferObject(gl, gl.ARRAY_BUFFER, new Float32Array(this.#positions)),
                    location: this.#program.attributes.position, size: Vector.COMPONENTS, type: gl.FLOAT},
                {vbo: new VertexBufferObject(gl, gl.ARRAY_BUFFER, new Float32Array(this.#normals)),
                    location: this.#program.attributes.normal, size: Vector.COMPONENTS, type: gl.FLOAT},
                {vbo: new VertexBufferObject(gl, gl.ARRAY_BUFFER, new Float32Array(this.#getTextureCoordinates(null))),
                    location: this.#program.attributes.textureCoordinatesCenter, size: Vector.COMPONENTS, type: gl.FLOAT},
                {vbo: new VertexBufferObject(gl, gl.ARRAY_BUFFER, new Float32Array(this.#getTextureCoordinates(Direction.N))),
                    location: this.#program.attributes.textureCoordinatesN, size: Vector.COMPONENTS, type: gl.FLOAT},
                {vbo: new VertexBufferObject(gl, gl.ARRAY_BUFFER, new Float32Array(this.#getTextureCoordinates(Direction.NE))),
                    location: this.#program.attributes.textureCoordinatesNE, size: Vector.COMPONENTS, type: gl.FLOAT},
                {vbo: new VertexBufferObject(gl, gl.ARRAY_BUFFER, new Float32Array(this.#getTextureCoordinates(Direction.E))),
                    location: this.#program.attributes.textureCoordinatesE, size: Vector.COMPONENTS, type: gl.FLOAT},
                {vbo: new VertexBufferObject(gl, gl.ARRAY_BUFFER, new Float32Array(this.#getTextureCoordinates(Direction.SE))),
                    location: this.#program.attributes.textureCoordinatesSE, size: Vector.COMPONENTS, type: gl.FLOAT},
                {vbo: new VertexBufferObject(gl, gl.ARRAY_BUFFER, new Float32Array(this.#getTextureCoordinates(Direction.S))),
                    location: this.#program.attributes.textureCoordinatesS, size: Vector.COMPONENTS, type: gl.FLOAT},
                {vbo: new VertexBufferObject(gl, gl.ARRAY_BUFFER, new Float32Array(this.#getTextureCoordinates(Direction.SW))),
                    location: this.#program.attributes.textureCoordinatesSW, size: Vector.COMPONENTS, type: gl.FLOAT},
                {vbo: new VertexBufferObject(gl, gl.ARRAY_BUFFER, new Float32Array(this.#getTextureCoordinates(Direction.W))),
                    location: this.#program.attributes.textureCoordinatesW, size: Vector.COMPONENTS, type: gl.FLOAT},
                {vbo: new VertexBufferObject(gl, gl.ARRAY_BUFFER, new Float32Array(this.#getTextureCoordinates(Direction.NW))),
                    location: this.#program.attributes.textureCoordinatesNW, size: Vector.COMPONENTS, type: gl.FLOAT}
            ], new VertexBufferObject(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.#indices)));
            this.#count = this.#indices.length;
            return this;
        })();
    }

    get latitude() {
        return this.#garden.latitude;
    }

    get longitude() {
        return this.#garden.longitude;
    }

    getAltitude(latitude, longitude) { // TODO improve
        return (this.#getAltitude(Math.floor(latitude), Math.floor(longitude))
                + this.#getAltitude(Math.floor(latitude), Math.ceil(longitude))
                + this.#getAltitude(Math.ceil(latitude), Math.floor(longitude))
                + this.#getAltitude(Math.ceil(latitude), Math.ceil(longitude))) / 4;
    }

    render(projection, view, model, light) {
        this.#gl.useProgram(this.#program.program);
        this.#gl.uniformMatrix4fv(this.#program.uniforms.projection, false, projection); // TODO do not set all here
        this.#gl.uniformMatrix4fv(this.#program.uniforms.view, false, view);
        this.#gl.uniformMatrix4fv(this.#program.uniforms.model, false, model);
        this.#gl.uniform3fv(this.#program.uniforms['light.ambient'], new Float32Array(light.ambient));
        this.#gl.uniform3fv(this.#program.uniforms['light.directional.color'], new Float32Array(light.directional.color));
        this.#gl.uniform3fv(this.#program.uniforms['light.directional.direction'], new Float32Array(light.directional.direction));
        this.#gl.uniform1i(this.#program.uniforms.terrains, this.#terrains.unit);
        this.#gl.bindVertexArray(this.#vao.vao);
        this.#gl.drawElements(this.#gl.TRIANGLES, this.#count, this.#gl.UNSIGNED_INT, 0);
        this.#gl.bindVertexArray(null);
    }

    get #positions() {
        const positions = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                const lat = 2 * latitude + 1;
                const lng = 2 * longitude + 1;
                const position = this.#getPosition(lat, lng);
                positions.push(position.x, position.y, position.z);
                for (let direction of Object.values(Direction)) {
                    const position = this.#getPosition(lat + direction.lat, lng + direction.lng);
                    positions.push(position.x, position.y, position.z);
                }
            }
        }
        return positions;
    }

    get #normals() {
        const normals = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                const lat = 2 * latitude + 1;
                const lng = 2 * longitude + 1;
                const normal = this.#getNormal(lat, lng);
                normals.push(normal.x, normal.y, normal.z);
                for (let direction of Object.values(Direction)) {
                    const normal = this.#getNormal(lat + direction.lat, lng + direction.lng);
                    normals.push(normal.x, normal.y, normal.z);
                }
            }
        }
        return normals;
    }

    get #indices() {
        const indices = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                for (let direction = 0; direction < Object.keys(Direction).length; direction++) {
                    const next = (direction + 1) % Object.keys(Direction).length;
                    const offset = latitude * this.#garden.longitude * (Object.keys(Direction).length + 1)
                            + longitude * (Object.keys(Direction).length + 1);
                    indices.push(offset + direction + 1, offset, offset + next + 1);
                }
            }
        }
        return indices;
    }

    #calculatePositionLattice() {
        const lattice = [];
        for (let latitude = 0; latitude < 2 * this.#garden.latitude + 1; latitude++) {
            lattice[latitude] = [];
            for (let longitude = 0; longitude < 2 * this.#garden.longitude + 1; longitude++) {
                const lat = Math.floor((latitude - 1) / 2);
                const lng = Math.floor((longitude - 1) / 2);
                let directions = [null];
                let altitude = 0.0;
                if ((latitude % 2 == 1) && (longitude % 2 == 0)) {
                    directions.push(Direction.E);
                } else if ((latitude % 2 == 0) && (longitude % 2 == 1)) {
                    directions.push(Direction.N);
                } else if ((latitude % 2 == 0) && (longitude % 2 == 0)) {
                    directions.push(Direction.N, Direction.NE, Direction.E);
                }
                lattice[latitude][longitude] = new Vector(Garden.#STEP_LATTICE * longitude,
                        Garden.#STEP_LATTICE * latitude, directions
                        .map((dir) => this.#getAltitude(lat + (dir?.lat ?? 0.0), lng + (dir?.lng ?? 0.0)))
                        .reduce((a, b) => a + b, 0.0) / directions.length);
            }
        }
        return lattice;
    }

    #calculateNormalLattice() {
        const lattice = [];
        for (let latitude = 0; latitude < 2 * this.#garden.latitude + 1; latitude++) {
            lattice[latitude] = [];
            for (let longitude = 0; longitude < 2 * this.#garden.longitude + 1; longitude++) {
                const positions = [];
                for (let direction of [null, ...Object.keys(Direction)]) {
                    positions[direction] = this.#getPosition(latitude + (Direction[direction]?.lat ?? 0.0),
                            longitude + (Direction[direction]?.lng ?? 0.0));
                }
                const step = ((latitude % 2 == 1) ^ (longitude % 2 == 1)) ? 2 : 1;
                let normal = new Vector(0.0, 0.0, 0.0);
                for (let direction = 0; direction < Object.keys(Direction).length; direction += step) {
                    const dir = Object.keys(Direction)[direction];
                    const next = Object.keys(Direction)[(direction + step) % Object.keys(Direction).length];
                    normal = normal.add(this.#calculateNormal(positions[dir], positions[null], positions[next]));
                }
                lattice[latitude][longitude] = normal.normalize();
            }
        }
        return lattice;
    }

    #getTextureCoordinates(direction) {
        const coordinates = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                for (let dir of [null, ...Object.values(Direction)]) {
                    let s = (this.#getTerrain(latitude + (direction?.lat ?? 0), longitude + (direction?.lng ?? 0))
                            + Garden.#STEP_LATTICE + ((dir?.lng ?? 0) - 2 * (direction?.lng ?? 0))
                            * Garden.#STEP_TEXTURE) / Object.keys(Terrain).length;
                    let t = Garden.#STEP_LATTICE - ((dir?.lat ?? 0) + 2 * (direction?.lat ?? 0)) * Garden.#STEP_TEXTURE;
                    let p = Math.max(2 - Math.sqrt(Math.pow((dir?.lng ?? 0) - 2 * (direction?.lng ?? 0), 2) +
                            Math.pow((dir?.lat ?? 0) - 2 * (direction?.lat ?? 0), 2)), 0.0);
                    coordinates.push(s, t, p);
                }
            }
        }
        return coordinates;
    }

    #getAltitude(latitude, longitude) {
        const lat = this.#garden.latitude - Math.min(Math.max(latitude, 0), this.#garden.latitude - 1) - 1;
        const lng = Math.min(Math.max(longitude, 0), this.#garden.longitude - 1);
        return this.#garden.altitudes[lat * this.#garden.longitude + lng];
    }

    #getTerrain(latitude, longitude) {
        const lat = this.#garden.latitude - Math.min(Math.max(latitude, 0), this.#garden.latitude - 1) - 1;
        const lng = Math.min(Math.max(longitude, 0), this.#garden.longitude - 1);
        return Terrain[this.#garden.terrains[lat * this.#garden.longitude + lng]];
    }

    #getPosition(latitude, longitude) {
        const lat = Math.min(Math.max(latitude, 0), 2 * this.#garden.latitude);
        const lng = Math.min(Math.max(longitude, 0), 2 * this.#garden.longitude);
        return new Vector(Garden.#STEP_LATTICE * longitude, Garden.#STEP_LATTICE * latitude,
                this.#positionLattice[lat][lng].z);
    }

    #getNormal(latitude, longitude) {
        const lat = Math.min(Math.max(latitude, 0), 2 * this.#garden.latitude);
        const lng = Math.min(Math.max(longitude, 0), 2 * this.#garden.longitude);
        return this.#normalLattice[lat][lng];
    }

    #calculateNormal(a, b, c) {
        return b.subtract(a).cross(c.subtract(b)).normalize();
    }
}
