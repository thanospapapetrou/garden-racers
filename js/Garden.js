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

    #calculatePositions() {
        const positions = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                const latC = latitude + 0.5;
                const latN = latitude + 1.0;
                const latS = latitude;
                const longC = longitude + 0.5;
                const longE = longitude + 1.0;
                const longW = longitude;
                const altC = this.#getAltitude(latitude, longitude);
                const altN = this.#getAltitude(latitude + 1, longitude);
                const altNE = this.#getAltitude(latitude + 1, longitude + 1);
                const altE = this.#getAltitude(latitude, longitude + 1);
                const altSE = this.#getAltitude(latitude - 1, longitude + 1);
                const altS = this.#getAltitude(latitude - 1, longitude);
                const altSW = this.#getAltitude(latitude - 1, longitude - 1);
                const altW = this.#getAltitude(latitude, longitude - 1);
                const altNW = this.#getAltitude(latitude + 1, longitude - 1);
                positions.push(longC, latC, altC);
                positions.push(longC, latN, (altC + altN) / 2.0);
                positions.push(longE, latN, (altC + altN + altNE + altE) / 4.0);
                positions.push(longE, latC, (altC + altE) / 2.0);
                positions.push(longE, latS, (altC + altE + altSE + altS) / 4.0);
                positions.push(longC, latS, (altC + altS) / 2.0);
                positions.push(longW, latS, (altC + altS + altSW + altW) / 4.0);
                positions.push(longW, latC, (altC + altW) / 2.0);
                positions.push(longW, latN, (altC + altW + altNW + altN) / 4.0);
            }
        }
        return positions;
    }

    #calculateNormals() {
        const normals = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                const center = this.#getPosition(latitude, longitude, null);
                const northCenter = this.#getPosition(latitude + 1, longitude, null);
                const eastCenter = this.#getPosition(latitude, longitude + 1, null);
                const southCenter = this.#getPosition(latitude - 1, longitude, null);
                const westCenter = this.#getPosition(latitude, longitude - 1, null);
                const north = this.#getPosition(latitude, longitude, Direction.NORTH);
                const northeast = this.#getPosition(latitude, longitude, Direction.NORTHEAST);
                const east = this.#getPosition(latitude, longitude, Direction.EAST);
                const southeast = this.#getPosition(latitude, longitude, Direction.SOUTHEAST);
                const south = this.#getPosition(latitude, longitude, Direction.SOUTH);
                const southwest = this.#getPosition(latitude, longitude, Direction.SOUTHWEST);
                const west = this.#getPosition(latitude, longitude, Direction.WEST);
                const northwest = this.#getPosition(latitude, longitude, Direction.NORTHWEST);
                normals.push(center.x, center.y, this.#calculateNormal(north, center, northeast)
                        .add(this.#calculateNormal(northeast, center, east))
                        .add(this.#calculateNormal(east, center, southeast))
                        .add(this.#calculateNormal(southeast, center, south))
                        .add(this.#calculateNormal(south, center, southwest))
                        .add(this.#calculateNormal(southwest, center, west))
                        .add(this.#calculateNormal(west, center, northwest))
                        .add(this.#calculateNormal(northwest, center, north))
                        .normalize());
                normals.push(north.x, north.y, this.#calculateNormal(northCenter, north, northeast)
                        .add(this.#calculateNormal(northeast, north, center))
                        .add(this.#calculateNormal(center, north, northwest))
                        .add(this.#calculateNormal(northwest, north, northCenter))
                        .normalize());
                normals.push(northeast.x, northeast.y, this.#calculateNormal(, center, northeast)
                        // TODO
//                        .add(this.#calculateNormal(northwest, center, north))
//                        .add(this.#calculateNormal(northwest, center, north))
                        .add(this.#calculateNormal(northeast, center, east))
                        .normalize());
                normals.push(east.x, east.y, this.#calculateNormal(northeast, east, eastCenter)
                        .add(this.#calculateNormal(eastCenter, east, southeast))
                        .add(this.#calculateNormal(southeast, east, center))
                        .add(this.#calculateNormal(center, east, northeast))
                        .normalize());
                normals.push(southeast.x, southeast.y, this.#calculateNormal(east, center, southeast)
                    // TODO
//                        .add(this.#calculateNormal(northwest, center, north))
//                        .add(this.#calculateNormal(northwest, center, north))
                        .add(this.#calculateNormal(southeast, center, south))
                        .normalize());
                normals.push(south.x, south.y, this.#calculateNormal(center, south, southeast)
                        .add(this.#calculateNormal(southeast, south, southCenter))
                        .add(this.#calculateNormal(southCenter, south, southwest))
                        .add(this.#calculateNormal(southwest, south, center))
                        .normalize());
                normals.push(southwest.x, southwest.y, this.#calculateNormal(south, center, southeast)
                    // TODO
//                        .add(this.#calculateNormal(northwest, center, north))
//                        .add(this.#calculateNormal(northwest, center, north))
                        .add(this.#calculateNormal(southeast, center, west))
                        .normalize());
                normals.push(west.x, west.y, this.#calculateNormal(northwest, west, center)
                        .add(this.#calculateNormal(center, west, southwest))
                        .add(this.#calculateNormal(southwest, west, westCenter))
                        .add(this.#calculateNormal(westCenter, west, northwest))
                        .normalize());
                normals.push(northwest.x, northwest.y, this.#calculateNormal(west, center, northwest)
                // TODO
//                        .add(this.#calculateNormal(northwest, center, north))
//                        .add(this.#calculateNormal(northwest, center, north))
                        .add(this.#calculateNormal(northwest, center, north))
                        .normalize());


                normals.push(0.0, 0.0, 1.0);
                normals.push(0.0, 0.0, 1.0);
            }
        }
//        for (let latitude = 0; latitude < 2 * this.#garden.latitude + 1; latitude++) {
//            for (let longitude = 0; longitude < 2 * this.#garden.longitude + 1; longitude++) {
//                const c = this.#getPosition(latitude, longitude);
//                const n = this.#getPosition(latitude + 1, longitude);
//                const ne = this.#getPosition(latitude + 1, longitude + 1);
//                const e = this.#getPosition(latitude, longitude + 1);
//                const se = this.#getPosition(latitude - 1, longitude + 1);
//                const s = this.#getPosition(latitude - 1, longitude);
//                const sw = this.#getPosition(latitude - 1, longitude - 1);
//                const w = this.#getPosition(latitude, longitude - 1);
//                const nw = this.#getPosition(latitude + 1, longitude - 1);
//                let normal = null; // TODO refactor to reduce size
//                if ((latitude % 2 == 1) && (longitude % 2 == 1)) { // between parallels and between meridians
//                    normal = this.#calculateNormal(n, c, ne)
//                            .add(this.#calculateNormal(ne, c, e))
//                            .add(this.#calculateNormal(e, c, se))
//                            .add(this.#calculateNormal(se, c, s))
//                            .add(this.#calculateNormal(s, c, sw))
//                            .add(this.#calculateNormal(sw, c, w))
//                            .add(this.#calculateNormal(w, c, nw))
//                            .add(this.#calculateNormal(nw, c, n))
//                            .normalize();
//                } else if (latitude % 2 == 1) { // between parallels and on meridian
//                    normal = this.#calculateNormal(n, c, e)
//                            .add(this.#calculateNormal(e, c, s))
//                            .add(this.#calculateNormal(s, c, w))
//                            .add(this.#calculateNormal(w, c, n))
//                            .normalize();
//                } else if (longitude % 2 == 1) { // on parallel between meridians
//                    normal = this.#calculateNormal(n, c, e)
//                            .add(this.#calculateNormal(e, c, s))
//                            .add(this.#calculateNormal(s, c, w))
//                            .add(this.#calculateNormal(w, c, n))
//                            .normalize();
//                } else { // on parallel and on meridian
//                    normal = this.#calculateNormal(n, c, ne)
//                            .add(this.#calculateNormal(ne, c, e))
//                            .add(this.#calculateNormal(e, c, se))
//                            .add(this.#calculateNormal(se, c, s))
//                            .add(this.#calculateNormal(s, c, sw))
//                            .add(this.#calculateNormal(sw, c, w))
//                            .add(this.#calculateNormal(w, c, nw))
//                            .add(this.#calculateNormal(nw, c, n))
//                            .normalize();
//                }
//                normals.push(normal.x, normal.y, normal.z);
//            }
//        }
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
