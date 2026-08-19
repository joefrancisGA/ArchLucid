module MergeInvariants {
  datatype Node = Node(id: string, endpointKey: string)
  datatype Edge = Edge(id: string, fromId: string, toId: string)

  function NodeIds(nodes: seq<Node>): set<string> {
    set n | n in nodes :: n.id
  }

  predicate NoDanglingEdges(nodes: seq<Node>, edges: seq<Edge>) {
    forall e :: e in edges ==>
      e.fromId in NodeIds(nodes) && e.toId in NodeIds(nodes)
  }

  predicate NoEndpointKeyCollision(nodes: seq<Node>) {
    forall i, j :: 0 <= i < |nodes| && 0 < j < |nodes| && i != j ==>
      nodes[i].endpointKey != nodes[j].endpointKey
  }
}
