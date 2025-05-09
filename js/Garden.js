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
                // TODO simplify
                positions.push(longitude + 0.5, latitude + 0.5, this.#getAltitude(latitude, longitude));
                positions.push(longitude + 0.5, latitude + 1.0, (this.#getAltitude(latitude, longitude)
                        + this.#getAltitude(latitude + 1, longitude)) / 2.0);
                positions.push(longitude + 1.0, latitude + 1.0, (this.#getAltitude(latitude, longitude)
                        + this.#getAltitude(latitude + 1, longitude)
                        + this.#getAltitude(latitude + 1, longitude + 1)
                        + this.#getAltitude(latitude, longitude + 1)) / 4.0);
                positions.push(longitude + 1.0, latitude + 0.5, (this.#getAltitude(latitude, longitude)
                        + this.#getAltitude(latitude, longitude + 1)) / 2.0);
                positions.push(longitude + 1.0, latitude, (this.#getAltitude(latitude, longitude)
                        + this.#getAltitude(latitude, longitude + 1)
                        + this.#getAltitude(latitude - 1, longitude + 1)
                        + this.#getAltitude(latitude - 1, longitude)) / 4.0);
                positions.push(longitude + 0.5, latitude, (this.#getAltitude(latitude, longitude)
                        + this.#getAltitude(latitude - 1, longitude)) / 2.0);
                positions.push(longitude, latitude, (this.#getAltitude(latitude, longitude)
                        + this.#getAltitude(latitude - 1, longitude)
                        + this.#getAltitude(latitude - 1, longitude - 1)
                        + this.#getAltitude(latitude, longitude - 1)) / 4.0);
                positions.push(longitude, latitude + 0.5, (this.#getAltitude(latitude, longitude)
                        + this.#getAltitude(latitude, longitude - 1)) / 2.0);
                positions.push(longitude, latitude + 1.0, (this.#getAltitude(latitude, longitude)
                        + this.#getAltitude(latitude, longitude - 1)
                        + this.#getAltitude(latitude + 1, longitude - 1)
                        + this.#getAltitude(latitude + 1, longitude)) / 4.0);
            }
        }
        return positions;
    }

    #calculateNormals() {
        const normals = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                normals.push(0.0, 0.0, 1.0);
                normals.push(0.0, 0.0, 1.0);
                normals.push(0.0, 0.0, 1.0);
                normals.push(0.0, 0.0, 1.0);
                normals.push(0.0, 0.0, 1.0);
                normals.push(0.0, 0.0, 1.0);
                normals.push(0.0, 0.0, 1.0);
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
                textureCoordinates.push((terrain + 0.5) / Object.keys(Terrain).length, 0.5, 1.0);
                textureCoordinates.push((terrain + 0.5) / Object.keys(Terrain).length, 0.0, 1.0);
                textureCoordinates.push((terrain + 1.0) / Object.keys(Terrain).length, 0.0, 1.0);
                textureCoordinates.push((terrain + 1.0) / Object.keys(Terrain).length, 0.5, 1.0);
                textureCoordinates.push((terrain + 1.0) / Object.keys(Terrain).length, 1.0, 1.0);
                textureCoordinates.push((terrain + 0.5) / Object.keys(Terrain).length, 1.0, 1.0);
                textureCoordinates.push((terrain + 0.0) / Object.keys(Terrain).length, 1.0, 1.0);
                textureCoordinates.push((terrain + 0.0) / Object.keys(Terrain).length, 0.5, 1.0);
                textureCoordinates.push((terrain + 0.0) / Object.keys(Terrain).length, 0.0, 1.0);
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
        return this.#garden.altitudes[Math.min(Math.max(latitude, 0), this.#garden.latitude - 1) * this.#garden.longitude
                + Math.min(Math.max(longitude, 0), this.#garden.longitude - 1)];
    }

    #getTerrain(latitude, longitude) {
        return this.#garden.terrains[Math.min(Math.max(latitude, 0), this.#garden.latitude - 1) * this.#garden.longitude
                + Math.min(Math.max(longitude, 0), this.#garden.longitude - 1)]
    }

    #getPosition(latitude, longitude) {
        return new Vector(longitude / 2, latitude / 2,
                this.#positions[(Math.min(Math.max(latitude, 0), 2 * this.#garden.latitude)
                * (2 * this.#garden.longitude + 1) + Math.min(Math.max(longitude, 0), 2 * this.#garden.longitude))
                * Vector.COMPONENTS + 2]);
    }

    #calculateNormal(a, b, c) {
        return b.subtract(a).cross(c.subtract(b)).normalize();
    }
}
