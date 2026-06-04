import React, { useState } from "react";
import { useNodeStore } from "../store/nodeStore";
import MonacoCodeEditor from "./MonacoCodeEditor";

export default function CustomNodeWizard() {
  const isWizardOpen = useNodeStore(state => state.isWizardOpen);
  const setWizardOpen = useNodeStore(state => state.setWizardOpen);
  const createCustomNode = useNodeStore(state => state.createCustomNode);

  const [step, setStep] = useState(1);
  const [nodeData, setNodeData] = useState({
    name: "",
    type: "",
    description: "",
    category: "Custom",
    icon: "📦",
    color: "#6c757d",
    inputs: "",
    outputs: "",
    code: `function execute(input, context) {\n  return {\n    status: "success",\n    message: "Processed",\n    result: input\n  };\n}`
  });

  if (!isWizardOpen) return null;

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleSave = async () => {
    const inputs = nodeData.inputs.split(",").map(s => s.trim()).filter(Boolean);
    const outputs = nodeData.outputs.split(",").map(s => s.trim()).filter(Boolean);
    const success = await createCustomNode({ ...nodeData, inputs, outputs });
    if (success) {
      setWizardOpen(false);
      setStep(1);
      setNodeData({ ...nodeData, name: "", type: "", inputs: "", outputs: "" });
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content bg-dark text-white border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title">✨ Create Custom Node - Step {step} of 4</h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => setWizardOpen(false)}></button>
          </div>
          
          <div className="modal-body p-4">
            {step === 1 && (
              <div>
                <h6>Basic Information</h6>
                <div className="mb-3">
                  <label>Node Name</label>
                  <input type="text" className="form-control bg-dark text-white border-secondary" value={nodeData.name} onChange={e => setNodeData({...nodeData, name: e.target.value, type: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')})} />
                </div>
                <div className="mb-3">
                  <label>Node Type (Unique ID)</label>
                  <input type="text" className="form-control bg-dark text-white border-secondary" value={nodeData.type} readOnly />
                </div>
                <div className="mb-3">
                  <label>Category</label>
                  <input type="text" className="form-control bg-dark text-white border-secondary" value={nodeData.category} onChange={e => setNodeData({...nodeData, category: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label>Icon Emoji</label>
                  <input type="text" className="form-control bg-dark text-white border-secondary" value={nodeData.icon} onChange={e => setNodeData({...nodeData, icon: e.target.value})} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h6>Define Inputs</h6>
                <p className="text-muted small">Comma separated list of input fields (e.g. email, amount, customerName)</p>
                <input type="text" className="form-control bg-dark text-white border-secondary" value={nodeData.inputs} onChange={e => setNodeData({...nodeData, inputs: e.target.value})} />
              </div>
            )}

            {step === 3 && (
              <div>
                <h6>Define Outputs</h6>
                <p className="text-muted small">Comma separated list of output fields (e.g. status, message, result)</p>
                <input type="text" className="form-control bg-dark text-white border-secondary" value={nodeData.outputs} onChange={e => setNodeData({...nodeData, outputs: e.target.value})} />
              </div>
            )}

            {step === 4 && (
              <div>
                <h6>Execution Code</h6>
                <p className="text-muted small">Write the core logic. You can use mapped inputs and the context object.</p>
                <MonacoCodeEditor code={nodeData.code} onChange={code => setNodeData({...nodeData, code})} />
              </div>
            )}
          </div>

          <div className="modal-footer border-secondary">
            {step > 1 && <button className="btn btn-outline-light" onClick={handlePrev}>Back</button>}
            {step < 4 ? (
              <button className="btn btn-primary" onClick={handleNext} disabled={step === 1 && !nodeData.name}>Next</button>
            ) : (
              <button className="btn btn-success" onClick={handleSave}>💾 Save Custom Node</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
