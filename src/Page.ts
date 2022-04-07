import { Component } from "preact";

export abstract class Page<S> extends Component<{ params: Record<string, string> }, S> {}
