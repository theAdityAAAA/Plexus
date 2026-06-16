import { create } from "zustand";
import { applyNodeChanges, applyEdgeChanges, addEdge, updateEdge } from "reactflow";
import axios from "axios";

export const useWorkflowStore = create((set, get) => ({
  nodes: [],
  edges: [],
  workflowId: null,
  workflowName: "",
  workflowList: [],
  selectedEdge: null,
  selectedNode: null,
  nodeExecutionData: {},

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setWorkflowId: (id) => set({ workflowId: id }),
  setWorkflowName: (name) => set({ workflowName: name }),
  setSelectedEdge: (edge) => set({ selectedEdge: edge }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  createWorkflow: (name) => {
    set({
      workflowId: null,
      workflowName: name,
      nodes: [],
      edges: [],
      selectedNode: null
    });
  },


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

  onEdgeUpdate: (oldEdge, newConnection) =>
    set({
      edges: updateEdge(oldEdge, newConnection, get().edges)
    }),

  deleteNode: (id) =>
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id)
    }),

  deleteEdge: (id) =>
    set({
      edges: get().edges.filter((e) => e.id !== id)
    }),

  addNewNode: (type, customData = {}) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type: "custom",
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 400 + 100
      },
      data: { label: customData.name || type, type, ...customData }
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  updateNodeData: (id, dataUpdater) => {
    const updatedNodes = get().nodes.map((n) =>
      n.id === id
        ? {
          ...n,
          data: {
            ...n.data,
            ...dataUpdater(n.data)
          }
        }
        : n
    );

    const updatedNode =
      updatedNodes.find(
        (n) => n.id === id
      );

    set({
      nodes: updatedNodes,
      selectedNode: updatedNode
    });
  },

  updateNodeStatus: (
    id,
    status,
    output = null,
    error = null,
    duration = null
  ) => {
    console.log("STATUS FOR:", id);

    console.log(
      "AVAILABLE NODES:",
      get().nodes.map(n => n.id)
    );
    set({
      nodeExecutionData: {
        ...get().nodeExecutionData,

        [id]: {
          status,
          output,
          error,
          duration,
          updatedAt: new Date()
        }
      },

      nodes: get().nodes.map((n) =>
        n.id === id
          ? {
            ...n
          }
          : n
      )
    });
  },

  fetchWorkflows: async () => {
    const res = await axios.get("http://localhost:5005/api/workflows");
    set({ workflowList: res.data.data });
  },

  loadWorkflow: (id) => {
    const selected = get().workflowList.find((w) => w._id === id);
    if (!selected) return;

    set({
      workflowId: id,
      workflowName: selected.name,
      nodes: selected.nodes.map((n) => ({
        id: n.id,
        type: "custom",
        position: { x: Math.random() * 500, y: Math.random() * 400 },
        data: {
          label: n.type,
          type: n.type,
          alias: n.alias || "",
          config: n.config,
          userCode: n.userCode
        }
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
      const {
        nodes,
        edges,
        workflowId,
        workflowName
      } = get();


      const workflow = {
        name: workflowName,
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.data.type,
          alias: n.data.alias || "",
          config: n.data.config || {},
          userCode: n.data.userCode || ""
        })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
          data: {
            branch: e.data?.branch || null
          }
        }))
      };

      if (workflowId) {
        await axios.put(
          `http://localhost:5005/api/workflows/${workflowId}`,
          workflow
        );

        alert("Workflow Updated ✅");
      } else {
        const res = await axios.post(
          "http://localhost:5005/api/workflows",
          workflow
        );

        set({
          workflowId: res.data.data._id
        });

        alert("Workflow Created ✅");
      }

    } catch (error) {
      console.error(error);
      alert("Save failed");
    }
  },

  saveAsNewWorkflow: async () => {
    try {
      const {
        nodes,
        edges
      } = get();

      const newName = prompt(
        "Enter new workflow name"
      );

      if (!newName) return;

      const workflow = {
        name: newName,
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.data.type,
          alias: n.data.alias || "",
          config: n.data.config || {},
          userCode: n.data.userCode || ""
        })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
          data: {
            branch: e.data?.branch || null
          }
        }))
      };

      const res = await axios.post(
        "http://localhost:5005/api/workflows",
        workflow
      );

      set({
        workflowId: res.data.data._id,
        workflowName: newName
      });

      alert("Workflow Duplicated ✅");

    } catch (error) {
      console.error(error);
      alert("Save As New failed");
    }
  },

  runWorkflow: async () => {
    const { workflowId } = get();

    if (!workflowId)
      return alert("Save workflow first!");

    set({ nodeExecutionData: {} });

    await axios.post(
      `http://localhost:5005/api/workflows/${workflowId}/execute`
    );
  }
}));
