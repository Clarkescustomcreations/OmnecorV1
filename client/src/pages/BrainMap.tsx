import OmnecorDashboardLayout from "@/components/OmnecorDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Grid3x3, List } from "lucide-react";
import { useState, useMemo } from "react";
import NeuralGraphView from "@/components/NeuralGraphView";
import NeuralTreeView from "@/components/NeuralTreeView";
import { trpc } from "@/lib/trpc";
import { convertFileSystemToNeuralNetwork } from '@/lib/neuralNodeTree';

/**
 * Neural Brain Map Page
 */
export default function BrainMap() {
  const [viewMode, setViewMode] = useState<"graph" | "tree">("graph");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const [watchDir, setWatchDir] = useState('');
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();

  const { data: fileTree } = trpc.project.getFileTree.useQuery(
    { projectId: activeProjectId! },
    { enabled: !!activeProjectId, refetchInterval: 10_000 }
  );

  const registerWatcher = trpc.project.registerWatcher.useMutation({
    onSuccess: () => setActiveProjectId(watchDir), // use dir as ID
  });

  const neuralNetwork = useMemo(() => {
    if (!fileTree?.files) return { nodes: [], edges: [] };
    return convertFileSystemToNeuralNetwork(fileTree.files as any, activeProjectId ?? 'default');
  }, [fileTree, activeProjectId]);

  const selectedNode = neuralNetwork.nodes.find((n) => n.id === selectedNodeId);

  return (
    <OmnecorDashboardLayout>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-accent" />
              <div>
                <h1 className="text-xl font-bold">Neural Brain Map</h1>
                <p className="text-sm text-muted-foreground">
                  Spatial project organization with interactive node-based visualization
                </p>
              </div>
            </div>
            
            {/* Watch Controls */}
            <div className="flex items-center gap-2 mr-2">
              <Input
                placeholder="Absolute path to project…"
                value={watchDir}
                onChange={e => setWatchDir(e.target.value)}
                className="w-72 h-8 text-sm font-mono"
              />
              <Button
                size="sm"
                onClick={() => registerWatcher.mutate({ projectId: watchDir, rootDir: watchDir })}
                disabled={!watchDir || registerWatcher.isPending}
              >
                {registerWatcher.isPending ? 'Starting…' : 'Watch'}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                size="icon"
                variant={viewMode === "graph" ? "default" : "outline"}
                onClick={() => setViewMode("graph")}
                title="Graph view"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === "tree" ? "default" : "outline"}
                onClick={() => setViewMode("tree")}
                title="Tree view"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-6 p-6 overflow-hidden">
          {/* Graph/Tree View Area */}
          <div className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {viewMode === "graph" ? "Graph View" : "Tree View"}
                    </CardTitle>
                    <CardDescription>
                      {viewMode === "graph"
                        ? "Spatial organization of projects and files"
                        : "Hierarchical folder structure"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex overflow-hidden">
                {viewMode === "graph" ? (
                  <NeuralGraphView
                    network={neuralNetwork}
                    projectId={activeProjectId}
                    onNodeClick={setSelectedNodeId}
                    readOnly={false}
                  />
                ) : (
                  <NeuralTreeView
                    network={neuralNetwork}
                    onNodeClick={setSelectedNodeId}
                    readOnly={false}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Properties Panel */}
          <div className="w-80 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Master Network</CardTitle>
                <CardDescription className="text-xs">
                  Global project overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Files:</span>
                    <span className="font-mono">{fileTree?.files?.length ?? 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Selected Node</CardTitle>
                <CardDescription className="text-xs">
                  Node properties and details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedNode ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-mono truncate">{selectedNode.data?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-mono capitalize">{selectedNode.data?.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Path:</span>
                      <span className="font-mono text-xs truncate">{selectedNode.data?.path}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground text-sm">
                    Click a node to view details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </OmnecorDashboardLayout>
  );
}
