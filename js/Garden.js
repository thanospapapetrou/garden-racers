'use strict';

class Garden {
    static #ATTRIBUTES = ['position', 'normal', 'textureCoordinates'];
    static #IMAGE_TERRAIN = './img/terrain.png';
    static #SHADER_FRAGMENT = './glsl/garden.frag';
    static #SHADER_VERTEX = './glsl/garden.vert';
    static #UNIFORMS = {
        projection: (gl, uniform, projection) => gl.uniformMatrix4fv(uniform, false, projection),
        camera: (gl, uniform, camera) => gl.uniformMatrix4fv(uniform, false, camera),
        model: (gl, uniform, model) => gl.uniformMatrix4fv(uniform, false, model),
        terrain: (gl, uniform, texture) => gl.uniform1i(uniform, texture.unit - gl.TEXTURE0),
        light: {
            ambient: (gl, uniform, color) => gl.uniform3fv(uniform, color),
            directional: {
                color: (gl, uniform, color) => gl.uniform3fv(uniform, color),
                direction: (gl, uniform, direction) => gl.uniform3fv(uniform, direction)
            }
        }
    };

    #garden;
    #terrain;
    #positionLattice;
    #normalLattice;
    #positions;
    #normals;
    #textureCoordinates;
    #indices;
    #task;

    // TODO terrain blending
    // TODO map mirroring
    // TODO normals

    constructor(gl, url) {
        return (async () => {
            this.#garden = await(await GardenRacers.load(url)).json();
            this.#terrain = await new Texture(gl, gl.TEXTURE0, Garden.#IMAGE_TERRAIN);
            this.#positionLattice = this.#calculatePositionLattice();
            this.#normalLattice = this.#calculateNormalLattice();
            this.#positions = this.#calculatePositions();
            this.#normals = this.#calculateNormals();
            this.#textureCoordinates = this.#calculateTextureCoordinates();
            this.#indices = this.#calculateIndices();
            this.#task = new RenderingTask(gl, await new Renderer(gl, Garden.#SHADER_VERTEX, Garden.#SHADER_FRAGMENT,
                    Garden.#UNIFORMS, Garden.#ATTRIBUTES), {
                        position: new AttributeData(gl, this.#positions),
                        normal: new AttributeData(gl, this.#normals),
                        textureCoordinates: new AttributeData(gl, this.#textureCoordinates)
                    }, new IndexData(gl, this.#indices));
            return this;
        })();
    }

    render(projection, camera, model, light) {
        this.#task.render({projection, camera, model, terrain: this.#terrain, light});
    }

    #calculatePositionLattice() {
        const lattice = [];
        for (let latitude = 0; latitude < 2 * this.#garden.latitude + 1; latitude++) {
            for (let longitude = 0; longitude < 2 * this.#garden.longitude + 1; longitude++) {
                const lat = Math.floor((latitude - 1) / 2);
                const long = Math.floor((longitude - 1) / 2);
                let altitude = 0.0;
                if ((latitude % 2 == 1) && (longitude % 2 == 1)) { // between parallels and between meridians; altitude
                    altitude = this.#getAltitude(lat, long);
                } else if (latitude % 2 == 1) { // between parallels and on meridian; average east and west
                    altitude = (this.#getAltitude(lat, long + 1) + this.#getAltitude(lat, long)) / 2.0;
                } else if (longitude % 2 == 1) { // on parallel between meridians; average north and south
                    altitude = (this.#getAltitude(lat + 1, long) + this.#getAltitude(lat, long)) / 2.0;
                } else { // on parallel and on meridian; average all directions
                    altitude = (this.#getAltitude(lat + 1, long + 1) + this.#getAltitude(lat, long + 1)
                            + this.#getAltitude(lat, long) + this.#getAltitude(lat + 1, long)) / 4.0;
                }
                lattice.push(new Vector(0.5 * longitude, 0.5 * latitude, altitude));
            }
        }
        return lattice;
    }

    #calculateNormalLattice() {
        const lattice = [];
        for (let latitude = 0; latitude < 2 * this.#garden.latitude + 1; latitude++) {
            for (let longitude = 0; longitude < 2 * this.#garden.longitude + 1; longitude++) {
                const c = this.#getPositionLattice(latitude, longitude);
                const n = this.#getPositionLattice(latitude + 1, longitude);
                const ne = this.#getPositionLattice(latitude + 1, longitude + 1);
                const e = this.#getPositionLattice(latitude, longitude + 1);
                const se = this.#getPositionLattice(latitude - 1, longitude + 1);
                const s = this.#getPositionLattice(latitude - 1, longitude);
                const sw = this.#getPositionLattice(latitude - 1, longitude - 1);
                const w = this.#getPositionLattice(latitude, longitude - 1);
                const nw = this.#getPositionLattice(latitude + 1, longitude - 1);
                // TODO refactor to reduce size
                if ((latitude % 2 == 1) && (longitude % 2 == 1)) { // between parallels and between meridians
                    lattice.push(this.#calculateNormal(n, c, ne)
                            .add(this.#calculateNormal(ne, c, e))
                            .add(this.#calculateNormal(e, c, se))
                            .add(this.#calculateNormal(se, c, s))
                            .add(this.#calculateNormal(s, c, sw))
                            .add(this.#calculateNormal(sw, c, w))
                            .add(this.#calculateNormal(w, c, nw))
                            .add(this.#calculateNormal(nw, c, n))
                            .normalize());
                } else if (latitude % 2 == 1) { // between parallels and on meridian
                    lattice.push(this.#calculateNormal(n, c, e)
                            .add(this.#calculateNormal(e, c, s))
                            .add(this.#calculateNormal(s, c, w))
                            .add(this.#calculateNormal(w, c, n))
                            .normalize());
                } else if (longitude % 2 == 1) { // on parallel between meridians
                    lattice.push(this.#calculateNormal(n, c, e)
                            .add(this.#calculateNormal(e, c, s))
                            .add(this.#calculateNormal(s, c, w))
                            .add(this.#calculateNormal(w, c, n))
                            .normalize());
                } else { // on parallel and on meridian
                    lattice.push(this.#calculateNormal(n, c, ne)
                            .add(this.#calculateNormal(ne, c, e))
                            .add(this.#calculateNormal(e, c, se))
                            .add(this.#calculateNormal(se, c, s))
                            .add(this.#calculateNormal(s, c, sw))
                            .add(this.#calculateNormal(sw, c, w))
                            .add(this.#calculateNormal(w, c, nw))
                            .add(this.#calculateNormal(nw, c, n))
                            .normalize());
                }
            }
        }
        return lattice;
    }

    #calculatePositions() {
        const positions = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                const lat = 2 * latitude + 1;
                const long = 2 * longitude + 1;
                const position = this.#getPositionLattice(lat, long);
                positions.push(position.x, position.y, position.z);
                for (let direction of Object.values(Direction)) {
                    const foo = direction(lat, long); // TODO rename
                    const position = this.#getPositionLattice(foo.lat, foo.long);
                    positions.push(position.x, position.y, position.z);
                }
            }
        }
        return positions;
    }

    #calculateNormals() {
        const normals = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                const lat = 2 * latitude + 1;
                const long = 2 * longitude + 1;
                const normal = this.#getNormalLattice(lat, long);
                normals.push(normal.x, normal.y, normal.z);
                for (let direction of Object.values(Direction)) {
                    const foo = direction(lat, long); // TODO rename
                    const normal = this.#getNormalLattice(foo.lat, foo.long);
                    normals.push(normal.x, normal.y, normal.z);
                }
            }
        }
        return normals;
    }

    #calculateTextureCoordinates() {
        const textureCoordinates = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                const terrain = Object.keys(Terrain).indexOf(this.#getTerrain(latitude, longitude));
                const sC = (terrain + 0.5) / Object.keys(Terrain).length;
                const sE = (terrain + 1.0) / Object.keys(Terrain).length;
                const sW = terrain / Object.keys(Terrain).length;
                const tC = 0.5;
                const tN = 0.0;
                const tS = 1.0;
                textureCoordinates.push(sC, tC, 1.0);
                textureCoordinates.push(sC, tN, 1.0);
                textureCoordinates.push(sE, tN, 1.0);
                textureCoordinates.push(sE, tC, 1.0);
                textureCoordinates.push(sE, tS, 1.0);
                textureCoordinates.push(sC, tS, 1.0);
                textureCoordinates.push(sW, tS, 1.0);
                textureCoordinates.push(sW, tC, 1.0);
                textureCoordinates.push(sW, tN, 1.0);
            }
        }
        return textureCoordinates;
    }

    #calculateIndices() {
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

    #getAltitude(latitude, longitude) {
        const lat = Math.min(Math.max(latitude, 0), this.#garden.latitude - 1);
        const long = Math.min(Math.max(longitude, 0), this.#garden.longitude - 1);
        return this.#garden.altitudes[lat * this.#garden.longitude + long];
    }

    #getTerrain(latitude, longitude) {
        const lat = Math.min(Math.max(latitude, 0), this.#garden.latitude - 1);
        const long = Math.min(Math.max(longitude, 0), this.#garden.longitude - 1);
        return this.#garden.terrains[lat * this.#garden.longitude + long];
    }

    #getPositionLattice(latitude, longitude) {
        const lat = Math.min(Math.max(latitude, 0), 2 * this.#garden.latitude);
        const long = Math.min(Math.max(longitude, 0), 2 * this.#garden.longitude);
        return new Vector(0.5 * longitude, 0.5 * latitude,
            this.#positionLattice[lat * (2 * this.#garden.longitude + 1) + long].z);
    }

    #getNormalLattice(latitude, longitude) {
        const lat = Math.min(Math.max(latitude, 0), 2 * this.#garden.latitude);
        const long = Math.min(Math.max(longitude, 0), 2 * this.#garden.longitude);
        return this.#normalLattice[lat * (2 * this.#garden.longitude + 1) + long];
    }

    #getPosition(latitude, longitude, direction) {
        const lat = Math.min(Math.max(latitude, 0), this.#garden.latitude - 1);
        const long = Math.min(Math.max(longitude, 0), this.#garden.longitude - 1);
        const offset = (lat * this.#garden.longitude + long) * (Object.keys(Direction).length + 1)
                + ((direction == null) ? 0 : (Object.values(Direction).indexOf(direction) + 1));
        return new Vector(this.#positions[offset], this.#positions[offset + 1], this.#positions[offset + 2]);
    }

    #calculateNormal(a, b, c) {
        return b.subtract(a).cross(c.subtract(b)).normalize();
    }
}
