const OLL_DATA_URL = "assets/data/oll.json";

const MOVE_CONFIGS = {
	R: { axis: "x", layers: [1], dir: 1 },
	L: { axis: "x", layers: [-1], dir: -1 },
	U: { axis: "y", layers: [1], dir: 1 },
	D: { axis: "y", layers: [-1], dir: -1 },
	F: { axis: "z", layers: [-1], dir: -1 },
	B: { axis: "z", layers: [1], dir: 1 },
	M: { axis: "x", layers: [0], dir: -1 },
	E: { axis: "y", layers: [0], dir: -1 },
	S: { axis: "z", layers: [0], dir: -1 },
	r: { axis: "x", layers: [1, 0], dir: 1 },
	l: { axis: "x", layers: [-1, 0], dir: -1 },
	u: { axis: "y", layers: [1, 0], dir: 1 },
	d: { axis: "y", layers: [-1, 0], dir: -1 },
	f: { axis: "z", layers: [-1, 0], dir: -1 },
	b: { axis: "z", layers: [1, 0], dir: 1 },
	x: { axis: "x", layers: [-1, 0, 1], dir: 1 },
	y: { axis: "y", layers: [-1, 0, 1], dir: 1 },
	z: { axis: "z", layers: [-1, 0, 1], dir: -1 },
};

const FACE_COLORS = {
	U: "Y",
	D: "W",
	F: "G",
	B: "B",
	R: "R",
	L: "O",
};

const FACE_NORMALS = {
	U: [0, 1, 0],
	D: [0, -1, 0],
	F: [0, 0, 1],
	B: [0, 0, -1],
	R: [1, 0, 0],
	L: [-1, 0, 0],
};

const NORMAL_FACE_LOOKUP = {
	"0,1,0": "U",
	"0,-1,0": "D",
	"0,0,1": "F",
	"0,0,-1": "B",
	"1,0,0": "R",
	"-1,0,0": "L",
};

const U_INDEX_MAP = {
	"-1,-1": 0,
	"0,-1": 1,
	"1,-1": 2,
	"-1,0": 3,
	"0,0": 4,
	"1,0": 5,
	"-1,1": 6,
	"0,1": 7,
	"1,1": 8,
};

const SIDE_ROW_POSITIONS = {
	F: [
		{ x: -1, y: 1, z: 1 },
		{ x: 0, y: 1, z: 1 },
		{ x: 1, y: 1, z: 1 },
	],
	R: [
		{ x: 1, y: 1, z: 1 },
		{ x: 1, y: 1, z: 0 },
		{ x: 1, y: 1, z: -1 },
	],
	B: [
		{ x: 1, y: 1, z: -1 },
		{ x: 0, y: 1, z: -1 },
		{ x: -1, y: 1, z: -1 },
	],
	L: [
		{ x: -1, y: 1, z: -1 },
		{ x: -1, y: 1, z: 0 },
		{ x: -1, y: 1, z: 1 },
	],
};

const rotationToFace = (normal) => NORMAL_FACE_LOOKUP[normal.join(",")];

const rotateVector = (vector, axis, dir) => {
	const [x, y, z] = vector;
	switch (axis) {
		case "x":
			return dir === 1 ? [x, -z, y] : [x, z, -y];
		case "y":
			return dir === 1 ? [z, y, -x] : [-z, y, x];
		case "z":
			return dir === 1 ? [-y, x, z] : [y, -x, z];
		default:
			return vector;
	}
};

const createSolvedCubies = () => {
	const cubies = [];
	for (let x = -1; x <= 1; x += 1) {
		for (let y = -1; y <= 1; y += 1) {
			for (let z = -1; z <= 1; z += 1) {
				const stickers = {};
				if (y === 1) stickers.U = FACE_COLORS.U;
				if (y === -1) stickers.D = FACE_COLORS.D;
				if (z === 1) stickers.F = FACE_COLORS.F;
				if (z === -1) stickers.B = FACE_COLORS.B;
				if (x === 1) stickers.R = FACE_COLORS.R;
				if (x === -1) stickers.L = FACE_COLORS.L;
				cubies.push({ x, y, z, stickers });
			}
		}
	}
	return cubies;
};

const rotateCubie = (cubie, axis, dir) => {
	[cubie.x, cubie.y, cubie.z] = rotateVector([cubie.x, cubie.y, cubie.z], axis, dir);
	const rotatedStickers = {};
	Object.entries(cubie.stickers).forEach(([face, color]) => {
		const normal = FACE_NORMALS[face];
		const rotatedNormal = rotateVector(normal, axis, dir);
		const rotatedFace = rotationToFace(rotatedNormal);
		if (rotatedFace) {
			rotatedStickers[rotatedFace] = color;
		}
	});
	cubie.stickers = rotatedStickers;
};

const rotateLayers = (cubies, axis, layers, dir, turns) => {
	for (let turn = 0; turn < turns; turn += 1) {
		cubies.forEach((cubie) => {
			if (layers.includes(cubie[axis])) {
				rotateCubie(cubie, axis, dir);
			}
		});
	}
};

const sanitizeAlgorithm = (algorithm) =>
	(algorithm || "")
		.replace(/,/g, " ")
		.replace(/\s+/g, " ")
		.trim();

const normalizeMoveFace = (face, isWide) => {
	if (!isWide) return face;
	if ("RULDFB".includes(face)) return face.toLowerCase();
	return face;
};

const parseAlgorithm = (algorithm) => {
	const input = sanitizeAlgorithm(algorithm);
	let index = 0;

	const moves = [];

	const parseNumber = () => {
		let number = "";
		while (index < input.length && /\d/.test(input[index])) {
			number += input[index];
			index += 1;
		}
		return number ? Number(number) : 1;
	};

	const parseMove = () => {
		const face = input[index];
		if (!face || !/[RULDFBrludfbMESxyz]/.test(face)) {
			throw new Error(`Invalid move: ${face || ""}`);
		}
		index += 1;
		let isWide = false;
		if (input[index] === "w") {
			isWide = true;
			index += 1;
		}
		let turns = 1;
		if (input[index] === "2") {
			turns = 2;
			index += 1;
		}
		if (input[index] === "'" || input[index] === "`") {
			turns = turns === 2 ? 2 : -1;
			index += 1;
		}
		const normalizedFace = normalizeMoveFace(face, isWide);
		return { face: normalizedFace, turns };
	};

	const parseSequence = () => {
		const sequence = [];
		while (index < input.length) {
			const char = input[index];
			if (char === " ") {
				index += 1;
				continue;
			}
			if (char === "(") {
				index += 1;
				const inner = parseSequence();
				if (input[index] !== ")") {
					throw new Error("Unclosed group in algorithm.");
				}
				index += 1;
				const repeat = parseNumber();
				for (let i = 0; i < repeat; i += 1) {
					sequence.push(...inner);
				}
				continue;
			}
			if (char === ")") {
				break;
			}
			sequence.push(parseMove());
		}
		return sequence;
	};

	moves.push(...parseSequence());
	if (index < input.length && input[index] === ")") {
		throw new Error("Unexpected closing parenthesis in algorithm.");
	}
	return moves;
};

const stringifyAlgorithm = (moves) =>
	moves
		.map((move) => {
			if (move.turns === 2 || move.turns === -2) return `${move.face}2`;
			if (move.turns === -1) return `${move.face}'`;
			return move.face;
		})
		.join(" ")
		.trim();

const normalizeAlgorithmString = (algorithm) => stringifyAlgorithm(parseAlgorithm(algorithm));

const invertMoves = (moves) =>
	[...moves].reverse().map((move) => ({
		...move,
		turns: Math.abs(move.turns) === 2 ? 2 : -move.turns,
	}));

const invertAlgorithmString = (algorithm) => stringifyAlgorithm(invertMoves(parseAlgorithm(algorithm)));

const applyMove = (cubies, move) => {
	const config = MOVE_CONFIGS[move.face];
	if (!config) {
		throw new Error(`Invalid move: ${move.face}`);
	}
	const turns = Math.abs(move.turns) === 2 ? 2 : 1;
	const dir = config.dir * (move.turns === -1 ? -1 : 1);
	rotateLayers(cubies, config.axis, config.layers, dir, turns);
};

const findCubie = (cubies, x, y, z) =>
	cubies.find((cubie) => cubie.x === x && cubie.y === y && cubie.z === z);

const getUFacePattern = (cubies) => {
	const face = Array(9).fill(false);
	cubies.forEach((cubie) => {
		if (cubie.y === 1 && cubie.stickers.U) {
			const index = U_INDEX_MAP[`${cubie.x},${cubie.z}`];
			face[index] = cubie.stickers.U === FACE_COLORS.U;
		}
	});
	return face;
};

const getSideRowPattern = (cubies, face) =>
	SIDE_ROW_POSITIONS[face].map(({ x, y, z }) => {
		const cubie = findCubie(cubies, x, y, z);
		if (!cubie) return false;
		return cubie.stickers[face] === FACE_COLORS.U;
	});

const getOllPreviewPattern = (algString) => {
	const cubies = createSolvedCubies();
	const moves = parseAlgorithm(algString);
	const inverseMoves = invertMoves(moves);
	inverseMoves.forEach((move) => applyMove(cubies, move));
	return {
		U: getUFacePattern(cubies),
		F: getSideRowPattern(cubies, "F"),
		R: getSideRowPattern(cubies, "R"),
		B: getSideRowPattern(cubies, "B"),
		L: getSideRowPattern(cubies, "L"),
	};
};

const renderOllPreviewSvg = (pattern) => {
	const cell = 14;
	const gridSize = 7;
	const size = cell * gridSize;
	const stroke = 2.5;
	const sideStroke = 1.5;
	const sideThickness = 6;
	const yellow = "#f2e600";
	const gray = "#9b9b9b";
	const drawCell = (col, row, isYellow, isSide = false, sideOrientation = "horizontal") => {
		const fill = isYellow ? yellow : gray;
		const baseX = col * cell;
		const baseY = row * cell;
		const strokeWidth = isSide ? sideStroke : stroke;
		if (isSide) {
			const isHorizontal = sideOrientation === "horizontal";
			const width = isHorizontal ? cell : sideThickness;
			const height = isHorizontal ? sideThickness : cell;
			const x = isHorizontal ? baseX : baseX + (cell - sideThickness) / 2;
			const y = isHorizontal ? baseY + (cell - sideThickness) / 2 : baseY;
			return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="#000" stroke-width="${strokeWidth}" />`;
		}
		return `<rect x="${baseX}" y="${baseY}" width="${cell}" height="${cell}" fill="${fill}" stroke="#000" stroke-width="${strokeWidth}" />`;
	};

	const rects = [];
	pattern.U.forEach((isYellow, index) => {
		const row = Math.floor(index / 3);
		const col = index % 3;
		rects.push(drawCell(col + 2, row + 2, isYellow));
	});
	pattern.B.forEach((isYellow, index) => {
		rects.push(drawCell(index + 2, 1, isYellow, true, "horizontal"));
	});
	pattern.F.forEach((isYellow, index) => {
		rects.push(drawCell(index + 2, 5, isYellow, true, "horizontal"));
	});
	pattern.L.forEach((isYellow, index) => {
		rects.push(drawCell(1, index + 2, isYellow, true, "vertical"));
	});
	pattern.R.forEach((isYellow, index) => {
		rects.push(drawCell(5, index + 2, isYellow, true, "vertical"));
	});

	return `\n\t\t<svg class="oll-preview" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="OLL preview">\n\t\t\t${rects.join("\n\t\t\t")}\n\t\t</svg>\n\t`;
};

const getPreviewAlgorithm = (ollCase) => {
	const standard = (ollCase.algorithm || "").trim();
	const fallback = (ollCase.setup || "").trim();
	const auf = (ollCase.auf || "").trim();
	const base = standard || fallback;
	return [base, auf].filter(Boolean).join(" ").trim();
};

const loadOllGroups = async () => {
	const response = await fetch(OLL_DATA_URL, { cache: "no-store" });
	if (!response.ok) {
		throw new Error(`Unable to load OLL data (${response.status})`);
	}
	const data = await response.json();
	return Array.isArray(data.groups) ? data.groups : [];
};

const createDebugControls = (ollOverview) => {
	const isDebugAllowed =
		location.hostname === "localhost" ||
		location.search.includes("ollDebug=1") ||
		localStorage.getItem("ollPreviewDebug") === "true";

	const controls = {
		available: false,
		enabled: false,
		output: null,
		buttons: new Set(),
	};

	if (!isDebugAllowed) {
		return controls;
	}

	controls.available = true;
	const wrapper = document.createElement("div");
	wrapper.className = "oll-debug-controls";
	const label = document.createElement("label");
	label.className = "oll-debug-toggle";
	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.addEventListener("change", () => {
		controls.enabled = checkbox.checked;
		document.body.classList.toggle("oll-debug-active", controls.enabled);
		controls.buttons.forEach((button) => {
			button.disabled = !controls.enabled;
		});
	});
	label.appendChild(checkbox);
	label.appendChild(document.createTextNode(" Show preview debug"));
	wrapper.appendChild(label);

	const output = document.createElement("pre");
	output.className = "oll-debug-output";
	output.textContent = "Select an OLL card to print its preview pattern.";
	wrapper.appendChild(output);

	ollOverview.prepend(wrapper);
	controls.output = output;
	return controls;
};

const createCaseRow = (ollCase, groupName, previewCache, debugControls) => {
	const link = document.createElement("a");
	const setupAlgorithm = [ollCase.rotations, ollCase.setup]
		.filter((value) => value && value.trim())
		.join(" ")
		.trim();
	const resolvedSetup = setupAlgorithm || "None";
	const algorithmParam = [ollCase.algorithm, ollCase.auf]
		.filter((value) => value && value.trim())
		.join(" ")
		.trim();
	const params = new URLSearchParams();
	if (setupAlgorithm) {
		params.set("setup", setupAlgorithm);
	}
	if (algorithmParam) {
		params.set("alg", algorithmParam);
	}
	link.href = `algs/alg.html?${params.toString()}`;
	link.className = "oll-row";
	link.setAttribute("aria-label", `OLL ${ollCase.number} ${groupName}`);

	const previewAlgorithm = getPreviewAlgorithm(ollCase);
	let pattern = previewCache.get(previewAlgorithm);
	if (!pattern) {
		try {
			pattern = getOllPreviewPattern(previewAlgorithm);
		} catch (error) {
			pattern = {
				U: Array(9).fill(true),
				F: Array(3).fill(false),
				R: Array(3).fill(false),
				B: Array(3).fill(false),
				L: Array(3).fill(false),
			};
		}
		previewCache.set(previewAlgorithm, pattern);
	}

	const number = document.createElement("div");
	number.className = "oll-row__number";
	number.textContent = ollCase.number;

	const previewWrapper = document.createElement("div");
	previewWrapper.className = "oll-preview__wrapper";
	previewWrapper.innerHTML = renderOllPreviewSvg(pattern);

	const info = document.createElement("div");
	info.className = "oll-row__info";
	const notationLabel = ollCase.code || `OLL ${ollCase.number}`;
	const probabilityLabel = ollCase.probability || "1/54";
	info.innerHTML = `
		<div class="oll-row__title">OLL ${ollCase.number}</div>
		<div class="oll-row__algorithm">
			<div><strong>Setup:</strong> ${resolvedSetup}</div>
			<div><strong>Standard Alg:</strong> ${ollCase.algorithm}</div>
		</div>
		<div class="oll-row__meta">
			<span class="oll-row__notation">Notation: ${notationLabel}</span>
			<span class="oll-probability">probability = ${probabilityLabel}</span>
		</div>
	`;

	if (debugControls.available) {
		const debugButton = document.createElement("button");
		debugButton.type = "button";
		debugButton.className = "oll-debug-button";
		debugButton.textContent = "Debug";
		debugButton.disabled = !debugControls.enabled;
		debugButton.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			if (!debugControls.enabled || !debugControls.output) return;
			debugControls.output.textContent = JSON.stringify(
				{
					case: `OLL ${ollCase.number}`,
					algorithm: previewAlgorithm,
					pattern,
				},
				null,
				2
			);
		});
		debugControls.buttons.add(debugButton);
		info.appendChild(debugButton);
	}

	link.appendChild(number);
	link.appendChild(previewWrapper);
	link.appendChild(info);
	return link;
};

const renderOllGroups = (groups, ollTable) => {
	const previewCache = new Map();
	const ollOverview = document.getElementById("ollOverview");
	const debugControls = ollOverview ? createDebugControls(ollOverview) : { available: false };
	const queue = [...groups];
	const schedule =
		window.requestIdleCallback ||
		window.requestAnimationFrame ||
		((callback) => setTimeout(callback, 0));

	const renderNext = () => {
		const group = queue.shift();
		if (!group) return;

		const section = document.createElement("section");
		section.className = "oll-group";

		const title = document.createElement("h3");
		title.className = "oll-group__title";
		title.textContent = group.name;
		section.appendChild(title);

		const cases = document.createElement("div");
		cases.className = "oll-group__cases";
		group.cases.forEach((ollCase) => {
			cases.appendChild(createCaseRow(ollCase, group.name, previewCache, debugControls));
		});

		section.appendChild(cases);
		ollTable.appendChild(section);
		if (queue.length) {
			schedule(renderNext);
		}
	};

	schedule(renderNext);
};

const renderOllOverview = () => {
	const ollTable = document.getElementById("ollTable");
	if (!ollTable) {
		return;
	}
	loadOllGroups()
		.then((groups) => {
			renderOllGroups(groups, ollTable);
		})
		.catch((error) => {
			const message = document.createElement("p");
			message.className = "oll-error";
			message.textContent =
				"Unable to load OLL data. Start a local server (python -m http.server 4173) and reload.";
			ollTable.appendChild(message);
			console.error(error);
		});
};

if (typeof document !== "undefined") {
	renderOllOverview();
}
