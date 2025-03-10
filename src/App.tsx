import { useState, useRef, useCallback, useMemo, FC } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Box, Button, List, ListItem, ListItemText, Dialog, TextField, Select, MenuItem, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import * as THREE from "three";
import "./App.css";
import { SelectChangeEvent } from "@mui/material/Select";

interface PrimitiveProps {
  id: number;
  type: "box" | "pyramid";
  position: [number, number, number];
  dimensions: [number, number, number];
  colors: string[];
  onClick: () => void;
  isSelected: boolean;
}

const generateFaceColors = () =>
  Array.from({ length: 6 }, () => new THREE.Color(Math.random(), Math.random(), Math.random()).getStyle());

const createBoxGeometry = (width: number, height: number, depth: number) => {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    // Front
    -width / 2, -height / 2, depth / 2,
    width / 2, -height / 2, depth / 2,
    width / 2, height / 2, depth / 2,
    -width / 2, height / 2, depth / 2,
    // Back
    -width / 2, -height / 2, -depth / 2,
    -width / 2, height / 2, -depth / 2,
    width / 2, height / 2, -depth / 2,
    width / 2, -height / 2, -depth / 2,
    // Top
    -width / 2, height / 2, -depth / 2,
    -width / 2, height / 2, depth / 2,
    width / 2, height / 2, depth / 2,
    width / 2, height / 2, -depth / 2,
    // Bottom
    -width / 2, -height / 2, -depth / 2,
    width / 2, -height / 2, -depth / 2,
    width / 2, -height / 2, depth / 2,
    -width / 2, -height / 2, depth / 2,
    // Right
    width / 2, -height / 2, -depth / 2,
    width / 2, height / 2, -depth / 2,
    width / 2, height / 2, depth / 2,
    width / 2, -height / 2, depth / 2,
    // Left
    -width / 2, -height / 2, -depth / 2,
    -width / 2, -height / 2, depth / 2,
    -width / 2, height / 2, depth / 2,
    -width / 2, height / 2, -depth / 2,
  ]);

  const indices = new Uint16Array([
    // Front
    0, 1, 2, 2, 3, 0,
    // Back
    4, 5, 6, 6, 7, 4,
    // Top
    8, 9, 10, 10, 11, 8,
    // Bottom
    12, 13, 14, 14, 15, 12,
    // Right
    16, 17, 18, 18, 19, 16,
    // Left
    20, 21, 22, 22, 23, 20,
  ]);

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  return geometry;
};

const createPyramidGeometry = (radius: number, height: number, radialSegments: number) => {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];

  for (let i = 0; i <= radialSegments; i++) {
    const angle = (i / radialSegments) * Math.PI * 2;
    vertices.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  }

  vertices.push(0, height, 0);

  for (let i = 1; i <= radialSegments; i++) {
    indices.push(0, i, i + 1);
  }

  const apexIndex = vertices.length / 3 - 1;
  for (let i = 1; i <= radialSegments; i++) {
    indices.push(i, apexIndex, (i % radialSegments) + 1);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

  return geometry;
};

const Primitive: FC<PrimitiveProps> = ({ type, position, dimensions, colors, onClick, isSelected }) => {
  const meshRef = useRef<THREE.Mesh | null>(null);

  const geometry = useMemo(() => {
    if (type === "box") {
      return createBoxGeometry(...dimensions);
    } else {
      return createPyramidGeometry(dimensions[0], dimensions[1], 4);
    }
  }, [type, dimensions]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({ color: colors[0] });
  }, [colors]);

  return (
    <mesh ref={meshRef} position={position} onClick={onClick} scale={isSelected ? 1.2 : 1} geometry={geometry}>
      <primitive attach="material" object={material} />
    </mesh>
  );
};

const PrimitiveListItem: FC<{ primitive: PrimitiveProps; index: number; selectedIndex: number | null; onClick: (index: number) => void }> = ({ primitive, index, selectedIndex, onClick }) => (
  <ListItem
    key={primitive.id}
    component="li"
    onClick={() => onClick(index)}
    style={{ background: selectedIndex === index ? "#0040a6" : "transparent", cursor: "pointer" }}
  >
    <ListItemText
      primary={`${primitive.type} (${primitive.position.map((n) => n.toFixed(1)).join(", ")})`}
      style={{ color: primitive.colors[0] }}
    />
  </ListItem>
);

const AddPrimitiveDialog: FC<{ open: boolean; onClose: () => void; onAdd: (form: { type: "box" | "pyramid"; width: number; height: number; depth: number; count: number }) => void }> = ({ open, onClose, onAdd }) => {
  const [form, setForm] = useState({ type: "box" as "box" | "pyramid", width: 1, height: 1, depth: 1, count: 1 });

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<"box" | "pyramid">) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === "type" ? event.target.value : +event.target.value,
    }));
  };

  const handleAdd = () => {
    onAdd(form);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add primitives group</DialogTitle>
      <DialogContent>
        <Box p={2}>
          <Select value={form.type} onChange={handleChange("type")} fullWidth>
            <MenuItem value="box">Box</MenuItem>
            <MenuItem value="pyramid">Pyramid</MenuItem>
          </Select>
          <TextField label="Width" type="number" value={form.width} onChange={handleChange("width")} fullWidth margin="normal" />
          <TextField label="Height" type="number" value={form.height} onChange={handleChange("height")} fullWidth margin="normal" />
          <TextField label="Length" type="number" value={form.depth} onChange={handleChange("depth")} fullWidth margin="normal" />
          <TextField label="Number" type="number" value={form.count} onChange={handleChange("count")} fullWidth margin="normal" />
          <DialogActions className="scene__buttons">
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleAdd}>
              Add
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default function App() {
  const [primitives, setPrimitives] = useState<PrimitiveProps[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const addPrimitives = useCallback((form: { type: "box" | "pyramid"; width: number; height: number; depth: number; count: number }) => {
    const newPrimitives: PrimitiveProps[] = Array.from({ length: form.count }, (_, i) => ({
      id: Date.now() + i,
      type: form.type,
      position: [Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2],
      dimensions: [form.width, form.height, form.depth],
      colors: generateFaceColors(),
      onClick: () => setSelectedIndex(primitives.length + i),
      isSelected: false,
    }));
    setPrimitives((prev) => [...newPrimitives, ...prev]);
  }, [primitives.length]);
  
  const handlePrimitiveClick = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const primitiveList = useMemo(() => (
    <List sx={{ maxHeight: "80vh", overflow: "auto" }}>
      {primitives.map((p, i) => (
        <PrimitiveListItem key={p.id} primitive={p} index={i} selectedIndex={selectedIndex} onClick={handlePrimitiveClick} />
      ))}
    </List>
  ), [primitives, selectedIndex, handlePrimitiveClick]);

  return (
    <Box display="flex" height="100vh">
      <Box width="350px" bgcolor="#002d75" p={2} display="flex" flexDirection="column" justifyContent="space-between">
        <Box display="flex" flexDirection="column" justifyContent="space-between" height={"100%"}>
          {primitiveList}
          <div className="scene__buttons">
            <Button variant="outlined" onClick={() => setPrimitives([])} disabled={primitives.length === 0} className="light" fullWidth>
              Clear Scene
            </Button>
            <Button variant="contained" onClick={() => setOpen(true)}>
              Add group
            </Button>
          </div>
        </Box>
      </Box>

      <Canvas camera={{ position: [5, 5, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <OrbitControls />
        {primitives.map((p, i) => (
          <Primitive key={p.id} {...p} onClick={() => setSelectedIndex(i)} isSelected={selectedIndex === i} />
        ))}
      </Canvas>

      <AddPrimitiveDialog open={open} onClose={() => setOpen(false)} onAdd={addPrimitives} />
    </Box>
  );
}
