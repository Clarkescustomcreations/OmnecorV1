"use client";

import React, { useMemo, useCallback, useEffect, useRef } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  Connection,
  addEdge,
} from "reactflow";
import "reactflow/dist/style.css";
import { NeuralNetwork } from "@/lib/neuralNodeTree";
import { useOmnecorSocket, FileEvent } from "@/hooks/useOmnecorSocket";

interface NeuralGraphViewProps {
  network: NeuralNetwork;
  projectId?: string;
  onNodeClick?: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  readOnly?: boolean;
}

/**
 * NeuralGraphView Component
 *
 * Renders a React Flow graph visualization of the neural network.
 * Displays nodes (folders/files) and edges (connections) in a
 * spatial, interactive layout with pan, zoom, and minimap controls.
 */
export default function NeuralGraphView({
  network,
  projectId,
  onNodeClick,
  onNodeDoubleClick,
  onEdgeClick,
  readOnly = false,
}: NeuralGraphViewProps) {
  // Suppress ResizeObserver errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes("ResizeObserver loop completed")) {
        event.preventDefault();
      }
    };
    const originalError = console.error;
    const errorHandler = (...args: unknown[]) => {
      if (
        args[0] &&
        typeof args[0] === "string" &&
        args[0].includes("ResizeObserver loop completed")
      )
        return;
      originalError.call(console, ...args);
    };

    window.addEventListener("error", handleError);
    console.error = errorHandler as any;

    return () => {
      window.removeEventListener("error", handleError);
      console.error = originalError;
    };
  }, []);

  // Convert neural nodes to React Flow nodes with stable dimensions
  const initialNodes: Node[] = useMemo(
    () =>
      network.nodes.map(neuralNode => ({
        id: neuralNode.id,
        data: {
          label: neuralNode.label,
          type: neuralNode.type,
          path: neuralNode.data.path,
        },
        position: neuralNode.position,
        style: {
          ...neuralNode.style,
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: neuralNode.type === "project" ? "bold" : "500",
          minWidth: "100px",
          textAlign: "center",
          cursor: "pointer",
        },
      })),
    [network.nodes]
  );

  // Convert neural edges to React Flow edges
  const initialEdges: Edge[] = useMemo(
    () =>
      network.edges.map(neuralEdge => ({
        id: neuralEdge.id,
        source: neuralEdge.source,
        target: neuralEdge.target,
        type: "smoothstep",
        animated: neuralEdge.type === "folder-connection",
      })),
    [network.edges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync with network prop changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // WebSocket Integration
  const { fileEvents } = useOmnecorSocket({ projectId });

  // Apply file system events to React Flow node state
  useEffect(() => {
    if (!projectId || !fileEvents.length) return;
    const latest = fileEvents[fileEvents.length - 1];

    if (latest.eventType === "add" || latest.eventType === "addDir") {
      const newNode: Node = {
        id: `ws-${latest.relativePath}`,
        data: {
          label: latest.relativePath.split("/").pop() ?? latest.relativePath,
          type: latest.eventType === "addDir" ? "folder" : "file",
          path: latest.relativePath,
        },
        position: { x: Math.random() * 500 + 50, y: Math.random() * 300 + 50 },
      };
      setNodes(prev => [...prev, newNode]);
    } else if (
      latest.eventType === "unlink" ||
      latest.eventType === "unlinkDir"
    ) {
      setNodes(prev => prev.filter(n => n.data?.path !== latest.relativePath));
    } else if (latest.eventType === "change") {
      // Pulse: add highlight class, remove after 1.2s
      setNodes(prev =>
        prev.map(n =>
          n.data?.path === latest.relativePath
            ? { ...n, className: "node-pulse" }
            : n
        )
      );
      setTimeout(
        () =>
          setNodes(prev =>
            prev.map(n =>
              n.data?.path === latest.relativePath ? { ...n, className: "" } : n
            )
          ),
        1200
      );
    }
  }, [fileEvents, projectId, setNodes]);

  const onConnect = useCallback(
    (connection: Connection) =>
      !readOnly && setEdges(eds => addEdge(connection, eds)),
    [readOnly, setEdges]
  );

  return (
    <div className="w-full h-full bg-background rounded-lg overflow-hidden border border-border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_e, n) => onNodeClick?.(n.id)}
        onNodeDoubleClick={(_e, n) => onNodeDoubleClick?.(n.id)}
        onEdgeClick={(_e, e) => onEdgeClick?.(e.id)}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <style>{`.node-pulse { box-shadow: 0 0 0 3px oklch(0.65 0.18 160); transition: box-shadow 1.2s ease-out; }`}</style>
    </div>
  );
}
