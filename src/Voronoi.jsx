import React, { useEffect } from "react";
import { useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import useMeasure from "react-use-measure";

import * as THREE from "three";

const geometry = new THREE.PlaneGeometry(2, 2);
const shader = new THREE.ShaderMaterial({
	uniforms: {
		u_time: { value: 0.0 },
		u_resolution: {
			value: new THREE.Vector2(0, 0),
		},
		u_mouse: { value: new THREE.Vector2(0.0, 0.0) },
		u_seedPixels: { value: new THREE.DataTexture() },
	},
	vertexShader: /*glsl*/ `        
        void main() {
            gl_Position = vec4(position, 1.0);
        }
    `,
	fragmentShader: /*glsl*/ `
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform float u_time;
        uniform sampler2D u_seedPixels;

        void main() {
            vec2 st = gl_FragCoord.xy/u_resolution.xy;
            vec4 seed = texture2D(u_seedPixels, st);

            // jump flood algorithm
            u

        }
    `,
});

const Voronoi = ({ width, height }) => {
	useFrame((state, delta, xrFrame) => {
		shader.uniforms.u_time.value += delta;
	});
	//array 4xwidthxheight
	const data = new Uint8Array(width * height * 4);

	//set 2 random pixels to red
    for (let i = 0; i < 100; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);

        const index = (x + y * width) * 4;
        data[index] = Math.random() * 255;
        data[index + 1] = Math.random() * 255;
        data[index + 2] = 0;
        data[index + 3] = Math.random() * 255;
    }
    console.log(data);

	const texture = new THREE.DataTexture(
		data,
		width,
		height,
		THREE.RGBAFormat
	);
	texture.needsUpdate = true;

	shader.uniforms.u_seedPixels.value = texture;

	shader.uniforms.u_resolution.value = new THREE.Vector2(width, height);

	return <mesh geometry={geometry} material={shader} />;
};

const App = (props) => {
	const [backgroundColor, setBackgroundColor] = useState("#000000");

	const [ref, bounds] = useMeasure();

	const getURLparams = () => {
		const urlParams = new URLSearchParams(window.location.search);
	};
	useEffect(() => {
		getURLparams();
	}, []);

	const urlToClipboard = () => {
		const url = new URL(window.location.href);
		navigator.clipboard.writeText(url.href);
	};

	return (
		<div className="flex flex-col pt-5 no-type">
			<div className="flex justify-center">
				<div
					className="flex flex-col rounded-lg items-center"
					style={{
						height: "50vh",
						width: "50vh",
						backgroundColor: backgroundColor,
					}}
					ref={ref}
				>
					<Canvas
						className="flex rounded-lg"
						gl={{
							premultipliedAlpha: false,
						}}
					>
						<Voronoi height={bounds.height} width={bounds.width} />
					</Canvas>
				</div>
			</div>
			<div className="flex flex-col">
				<button onClick={urlToClipboard}>Copy Link! Share it!</button>
			</div>
		</div>
	);
};

export default App;
