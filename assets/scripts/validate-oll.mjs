import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const dataPath = path.join(repoRoot, "assets/data/oll.json");

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

const normalToFace = (normal) =>
	({
		"0,1,0": "U",
		"0,-1,0": "D",
		"0,0,1": "F",
		"0,0,-1": "B",
		"1,0,0": "R",
		"-1,0,0": "L",
	}[normal.join(",")]);

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
		const rotatedFace = normalToFace(rotatedNormal);
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

const normalizeAlgorithm = (algorithm) =>
	algorithm
		.replace(/[()\[\]]/g, " ")
		.replace(/,/g, " ")
		.replace(/\s+/g, " ")
		.trim();

const composeAlgorithm = (ollCase) =>
	[ollCase.rotations, ollCase.setup, ollCase.algorithm, ollCase.auf]
		.filter((value) => value && value.trim())
		.join(" ")
		.trim();

const stripPreviewRotations = (algorithm) => {
	const normalized = normalizeAlgorithm(algorithm);
	if (!normalized) return normalized;
	return normalized
		.split(" ")
		.filter((token) => !/^[xz]/.test(token))
		.join(" ");
};

const parseAlgorithm = (algorithm) => {
	const normalized = normalizeAlgorithm(algorithm);
	if (!normalized) return [];
	return normalized.split(" ").map((token) => {
		const match = token.match(/^([RULDFBrludfbMESxyz])([2]?)(['`]?)$/);
		if (!match) {
			throw new Error(`Invalid move: ${token}`);
		}
		return {
			face: match[1],
			isDouble: match[2] === "2",
			isPrime: match[3] === "'" || match[3] === "`",
			raw: token,
		};
	});
};

const applyMove = (cubies, move) => {
	const config = MOVE_CONFIGS[move.face];
	if (!config) {
		throw new Error(`Invalid move: ${move.raw}`);
	}
	const turns = move.isDouble ? 2 : 1;
	const dir = config.dir * (move.isPrime ? -1 : 1);
	rotateLayers(cubies, config.axis, config.layers, dir, turns);
};

const invertMoves = (moves) =>
	[...moves].reverse().map((move) => ({
		...move,
		isPrime: move.isDouble ? move.isPrime : !move.isPrime,
	}));

const validateFaceCounts = (cubies) => {
	const counts = { U: 0, D: 0, F: 0, B: 0, R: 0, L: 0 };
	cubies.forEach((cubie) => {
		Object.keys(cubie.stickers).forEach((face) => {
			counts[face] += 1;
		});
	});
	return Object.entries(counts).every(([, count]) => count === 9);
};

const validateColorCounts = (cubies) => {
	const counts = { Y: 0, W: 0, G: 0, B: 0, R: 0, O: 0 };
	cubies.forEach((cubie) => {
		Object.values(cubie.stickers).forEach((color) => {
			counts[color] += 1;
		});
	});
	return Object.entries(counts).every(([, count]) => count === 9);
};

const validateCubies = (cubies) =>
	cubies.every((cubie) => {
		const faces = Object.keys(cubie.stickers);
		const colors = Object.values(cubie.stickers);
		return faces.length === new Set(faces).size && colors.length === new Set(colors).size;
	});

const validateCase = (ollCase) => {
	const cubies = createSolvedCubies();
	const algorithm = stripPreviewRotations(composeAlgorithm(ollCase));
	const moves = parseAlgorithm(algorithm);
	const inverseMoves = invertMoves(moves);
	inverseMoves.forEach((move) => applyMove(cubies, move));

	const topStickers = cubies.filter((cubie) => cubie.y === 1 && cubie.stickers.U).length;
	return {
		topStickers,
		validFaces: validateFaceCounts(cubies),
		validColors: validateColorCounts(cubies),
		validCubies: validateCubies(cubies),
		usesCubeRotation: /(^|\s)[xz]/.test(normalizeAlgorithm(composeAlgorithm(ollCase))),
	};
};

const raw = await readFile(dataPath, "utf8");
const data = JSON.parse(raw);
const groups = Array.isArray(data.groups) ? data.groups : [];

const errors = [];
const warnings = [];
const seenNumbers = new Set();

if (groups.length === 0) {
	errors.push("No OLL groups found in assets/data/oll.json.");
}

groups.forEach((group) => {
	(group.cases || []).forEach((ollCase) => {
		if (seenNumbers.has(ollCase.number)) {
			errors.push(`Duplicate OLL number detected: ${ollCase.number}`);
		}
		seenNumbers.add(ollCase.number);

		if (ollCase.category && ollCase.category !== group.name) {
			warnings.push(
				`OLL ${ollCase.number} category mismatch: "${ollCase.category}" vs group "${group.name}"`
			);
		}

		const result = validateCase(ollCase);
		if (result.topStickers !== 9) {
			errors.push(`OLL ${ollCase.number} does not keep 9 stickers on the U face.`);
		}
		if (!result.validFaces) {
			errors.push(`OLL ${ollCase.number} breaks face sticker counts.`);
		}
		if (!result.validColors) {
			errors.push(`OLL ${ollCase.number} breaks color counts.`);
		}
		if (!result.validCubies) {
			errors.push(`OLL ${ollCase.number} produces duplicate stickers on a cubie.`);
		}
		if (result.usesCubeRotation) {
			warnings.push(`OLL ${ollCase.number} uses x/z rotations that are stripped for previews.`);
		}
	});
});

if (warnings.length > 0) {
	console.warn("Warnings:");
	warnings.forEach((warning) => console.warn(`- ${warning}`));
}

if (errors.length > 0) {
	console.error("Validation errors:");
	errors.forEach((error) => console.error(`- ${error}`));
	process.exitCode = 1;
} else {
	console.log(`Validated ${seenNumbers.size} OLL cases from ${path.relative(repoRoot, dataPath)}.`);
}
