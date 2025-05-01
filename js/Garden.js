'use strict';

class Garden {
    static #ATTRIBUTES = ['position'];
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
       }
   };

    #gl;
    #renderer;
    #array;

    constructor(gl) {
        this.#gl = gl;
        return (async () => {
            this.#renderer = await new Renderer(this.#gl, Garden.#SHADER_VERTEX, Garden.#SHADER_FRAGMENT,
                    Garden.#UNIFORMS, Garden.#ATTRIBUTES);
            this.#array = this.#gl.createVertexArray();
            this.#gl.bindVertexArray(this.#array);
            const positions = this.#gl.createBuffer();
            this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, positions);
            this.#gl.bufferData(this.#gl.ARRAY_BUFFER, new Float32Array([
                0.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
                0.0, 0.0, -1.0,
                1.0, 0.0, -1.0
            ]), this.#gl.STATIC_DRAW);
            this.#gl.vertexAttribPointer(this.#renderer.attributes.position, 3, gl.FLOAT, false, 0, 0);
            this.#gl.enableVertexAttribArray(this.#renderer.attributes.position);

            // TODO refactor
            const indices = this.#gl.createBuffer();
            this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, indices);
            this.#gl.bufferData(this.#gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
                0, 1, 2,
                2, 1, 3]), this.#gl.STATIC_DRAW);
            this.#gl.bindVertexArray(null);
            return this;
        })();
    }

    render(projection, camera, model) {
        this.#gl.useProgram(this.#renderer.program);
        this.#renderer.uniforms.projection = projection;
        this.#renderer.uniforms.camera = camera;
        this.#renderer.uniforms.model = model;
        this.#renderer.uniforms.light.ambient = [0.25, 0.25, 0.25]; // 25% white TODO
        this.#renderer.uniforms.light.directional.color = [0.75, 0.75, 0.75]; // 75% white TODO
        this.#renderer.uniforms.light.directional.direction = [-1.0, -1.0, -1.0]; //  TODO
        // TODO render


        this.#gl.bindVertexArray(this.#array);
        this.#gl.drawElements(this.#gl.TRIANGLES, 6, this.#gl.UNSIGNED_SHORT, 0); // TODO byte
    }
}
