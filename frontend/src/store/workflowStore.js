import { create } from "zustand";
import { applyNodeChanges, applyEdgeChanges, addEdge } from "reactflow";
import axios from "axios";

export const useWorkflowStore = create((set, get) => ({
  nodes: [],
  edges: [],
  workflowId: null,
  workflowList: [],
  selectedEdge: null,
  selectedNode: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setWorkflowId: (id) => set({ workflowId: id }),
  setSelectedEdge: (edge) => set({ selectedEdge: edge }),
  setSelectedNode: (node) => set({ selectedNode: node }),

  onNodesChange: (changes) =>
    set({
      nodes: applyNodeChanges(changes, get().nodes)
    }),

  onEdgesChange: (changes) =>
    set({
      edges: applyEdgeChanges(changes, get().edges)
    }),

  onConnect: (params, branch = null) =>
    set({
      edges: addEdge({ ...params, data: { branch }, label: branch }, get().edges)
    }),

  addNewNode: (type, customData = {}) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 400 + 100
      },
      data: { label: customData.name || type, type, ...customData }
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  updateNodeData: (id, dataUpdater) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, ...dataUpdater(n.data) } }
          : n
      )
    });
    // Update selectedNode if it's the one being modified
    if (get().selectedNode?.id === id) {
      set({ selectedNode: get().nodes.find(n => n.id === id) });
    }
  },

  updateNodeStatus: (id, status) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id
          ? {
              ...n,
              style: {
                background: status === "completed" ? "#28a745" : status === "failed" ? "#dc3545" : "#ffc107",
                color: "white"
              }
            }
          : n
      )
    });
  },

  fetchWorkflows: async () => {
    const res = await axios.get("http://localhost:5000/api/workflows");
    set({ workflowList: res.data.data });
  },

  loadWorkflow: (id) => {
    const selected = get().workflowList.find((w) => w._id === id);
    if (!selected) return;

    set({
      workflowId: id,
      nodes: selected.nodes.map((n) => ({
        id: n.id,
        position: { x: Math.random() * 500, y: Math.random() * 400 },
        data: { label: n.type, type: n.type, config: n.config, userCode: n.userCode }
      })),
      edges: selected.edges.map((e, i) => ({
        id: `e-${i}`,
        source: e.source,
        target: e.target,
        data: { branch: e.data?.branch || null },
        label: e.data?.branch || null
      }))
    });
  },

  saveWorkflow: async () => {
    try {
      const { nodes, edges } = get();
      const workflow = {
        name: "Dynamic Workflow",
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.data.type,
          config: n.data.config || {},
          userCode: n.data.userCode || ""
        })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
          data: { branch: e.data?.branch || null }
        }))
      };

      const res = await axios.post("http://localhost:5000/api/workflows", workflow);
      set({ workflowId: res.data.data._id });
      alert("Workflow Saved 🚀");
    } catch (error) {
      console.error(error);
      alert("Save failed");
    }
  },

  runWorkflow: async () => {
    const { workflowId } = get();
    if (!workflowId) return alert("Save workflow first!");
    await axios.post(`http://localhost:5000/api/workflows/${workflowId}/execute`);
  }
}));
