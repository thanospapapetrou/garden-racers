'use strict';

class Garden {
    static #ATTRIBUTES = ['position', 'normal'];
    static #IMAGE_TERRAIN = './img/terrain.png';
    static #SHADER_FRAGMENT = './glsl/garden.frag';
    static #SHADER_VERTEX = './glsl/garden.vert';
    static #UNIFORMS = {
        projection: (gl, uniform, projection) => gl.uniformMatrix4fv(uniform, false, projection),
        camera: (gl, uniform, camera) => gl.uniformMatrix4fv(uniform, false, camera),
        model: (gl, uniform, model) => gl.uniformMatrix4fv(uniform, false, model),
        light: {
            ambient: (gl, uniform, color) => gl.uniform3fv(uniform, color),
            directional: {
                color: (gl, uniform, color) => gl.uniform3fv(uniform, color),
                direction: (gl, uniform, direction) => gl.uniform3fv(uniform, direction)
            }
        },
        latLng: (gl, uniform, latLng) => gl.uniform2iv(uniform, latLng),
        textureCoordinates: (gl, uniform, texture) => gl.uniform1i(uniform, texture.unit - gl.TEXTURE0),
        terrain: (gl, uniform, texture) => gl.uniform1i(uniform, texture.unit - gl.TEXTURE0)
    };

    #garden;
    #positionLattice;
    #normalLattice;
    #textureLattice;
    #task;

    // TODO terrain blending
    // TODO refactor to exact common superclass from Texture and DataTexture

    constructor(gl, url) {
        return (async () => {
            this.#garden = await(await GardenRacers.load(url)).json();
            this.#positionLattice = this.#calculatePositionLattice();
            this.#normalLattice = this.#calculateNormalLattice();
            this.#textureLattice = this.#calculateTextureLattice();
            const renderer = await new Renderer(gl, Garden.#SHADER_VERTEX, Garden.#SHADER_FRAGMENT, Garden.#UNIFORMS,
                    Garden.#ATTRIBUTES);
            renderer.latLng = [this.#garden.latitude, this.#garden.longitude];
            renderer.textureCoordinates = new DataTexture(gl, gl.TEXTURE1, this.#textureCoordinates);
            renderer.terrain = await new Texture(gl, gl.TEXTURE0, Garden.#IMAGE_TERRAIN)
            this.#task = new RenderingTask(gl, renderer, {
                        position: new AttributeData(gl, this.#positions),
                        normal: new AttributeData(gl, this.#normals)
                    }, new IndexData(gl, this.#indices));
            return this;
        })();
    }

    render(projection, camera, model, light) {
        this.#task.render({projection, camera, model, light}); // TODO do not set all here
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

    get #textureCoordinates() {
        const coordinates = [];
        // TODO take into account terrain
        // TODO make s and t index half pixels
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                coordinates.push(this.#textureLattice[null][null].x,
                        this.#textureLattice[null][null].y,
                        this.#textureLattice[null][null].z);
                        for (let dir of Object.keys(Direction)) {
                            coordinates.push(this.#textureLattice[null][dir].x,
                                    this.#textureLattice[null][dir].y,
                                    this.#textureLattice[null][dir].z);
                        }
                for (let direction of Object.keys(Direction)) {
                    coordinates.push(this.#textureLattice[direction][null].x,
                            this.#textureLattice[direction][null].y,
                            this.#textureLattice[direction][null].z);
                    for (let dir of Object.keys(Direction)) {
                        coordinates.push(this.#textureLattice[direction][dir].x,
                                this.#textureLattice[direction][dir].y,
                                this.#textureLattice[direction][dir].z);
                    }
                }
            }
        }
        return coordinates;
    }

    #calculatePositionLattice() {
        const lattice = [];
        for (let latitude = 0; latitude < 2 * this.#garden.latitude + 1; latitude++) {
            lattice[latitude] = [];
            for (let longitude = 0; longitude < 2 * this.#garden.longitude + 1; longitude++) {
                const lat = Math.floor((latitude - 1) / 2);
                const lng = Math.floor((longitude - 1) / 2);
                let altitude = 0.0;
                if ((latitude % 2 == 1) && (longitude % 2 == 1)) { // between parallels and between meridians; altitude
                    altitude = this.#getAltitude(lat, lng);
                } else if (latitude % 2 == 1) { // between parallels and on meridian; average east and west
                    altitude = (this.#getAltitude(lat, lng + 1)
                            + this.#getAltitude(lat, lng)) / 2.0;
                } else if (longitude % 2 == 1) { // on parallel between meridians; average north and south
                    altitude = (this.#getAltitude(lat + 1, lng)
                            + this.#getAltitude(lat, lng)) / 2.0;
                } else { // on parallel and on meridian; average all directions
                    altitude = (this.#getAltitude(lat + 1, lng + 1)
                            + this.#getAltitude(lat, lng + 1)
                            + this.#getAltitude(lat, lng)
                            + this.#getAltitude(lat + 1, lng)) / 4.0;
                }
                lattice[latitude][longitude] = new Vector(0.5 * longitude, 0.5 * latitude, altitude);
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
                positions[null] = this.#getPosition(latitude, longitude);
                for (let direction of Object.keys(Direction)) {
                    positions[direction] = this.#getPosition(latitude + Direction[direction].lat,
                            longitude + Direction[direction].lng);
                }
                let normal = new Vector(0.0, 0.0, 0.0);
                if ((latitude % 2 == 1) ^ (longitude % 2 == 1)) {
                    for (let direction = 0; direction < Object.keys(Direction).length; direction += 2) {
                        const dir = Object.keys(Direction)[direction];
                        const next = Object.keys(Direction)[(direction + 2) % Object.keys(Direction).length];
                        normal = normal.add(this.#calculateNormal(positions[dir], positions[null], positions[next]));
                    }
                } else {
                    for (let direction = 0; direction < Object.keys(Direction).length; direction++) {
                        const dir = Object.keys(Direction)[direction];
                        const next = Object.keys(Direction)[(direction + 1) % Object.keys(Direction).length];
                        normal = normal.add(this.#calculateNormal(positions[dir], positions[null], positions[next]));
                    }
                }
                lattice[latitude][longitude] = normal.normalize();
            }
        }
        return lattice;
    }

    #calculateTextureLattice() {
        const lattice = [];
        lattice[null] = [];
        lattice[null][null] = this.#calculateTextureCoordinates(null, null);
        for (let dir of Object.keys(Direction)) {
            lattice[null][dir] = this.#calculateTextureCoordinates(null, Direction[dir]);
        }
        for (let direction of Object.keys(Direction)) {
            lattice[direction] = [];
            lattice[direction][null] = this.#calculateTextureCoordinates(Direction[direction], null);
            for (let dir of Object.keys(Direction)) {
                lattice[direction][dir] = this.#calculateTextureCoordinates(Direction[direction], Direction[dir]);
            }
        }
        return lattice;
    }

    #getAltitude(latitude, longitude) {
        const lat = this.#garden.latitude - Math.min(Math.max(latitude, 0), this.#garden.latitude - 1) - 1;
        const lng = Math.min(Math.max(longitude, 0), this.#garden.longitude - 1);
        return this.#garden.altitudes[lat * this.#garden.longitude + lng];
    }

    #getTerrain(latitude, longitude) { // TODO is this required?
        const lat = this.#garden.latitude - Math.min(Math.max(latitude, 0), this.#garden.latitude - 1) - 1;
        const lng = Math.min(Math.max(longitude, 0), this.#garden.longitude - 1);
        return this.#garden.terrains[lat * this.#garden.longitude + lng];
    }

    #getPosition(latitude, longitude) {
        const lat = Math.min(Math.max(latitude, 0), 2 * this.#garden.latitude);
        const lng = Math.min(Math.max(longitude, 0), 2 * this.#garden.longitude);
        return new Vector(0.5 * longitude, 0.5 * latitude,
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

    #calculateTextureCoordinates(direction, dir) {
        let s = 0.25 * (direction?.lng ?? 0.0) - 0.5 * (dir?.lng ?? 0.0) + 0.5;
        let t = -0.25 * (direction?.lat ?? 0.0) + 0.5 * (dir?.lat ?? 0.0) + 0.5;
        return new Vector(s, t,
                Math.max(Math.sqrt(2.0) / 2.0 - Math.sqrt(Math.pow(0.5 - s, 2.0) + Math.pow(0.5 - t, 2.0)), 0.0));
    }
}
