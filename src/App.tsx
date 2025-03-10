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

const Primitive: FC<PrimitiveProps> = ({ type, position, dimensions, colors, onClick, isSelected }) => {
  const meshRef = useRef<THREE.Mesh | null>(null);
  return (
    <mesh ref={meshRef} position={position} onClick={onClick} scale={isSelected ? 1.2 : 1}>
      {type === "box" ? <boxGeometry args={dimensions} /> : <coneGeometry args={[dimensions[0], dimensions[1], 4]} />}
      {colors.map((color, i) => (
        <meshStandardMaterial key={i} attach={`material-${i}`} color={color} />
      ))}
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
  const [open, setOpen] = useState(false);

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
