import { API_HOST } from "./Constants";
import { getUrlParams } from "./Helper";
import { Page } from "./Page";

export class TradeFinePage extends Page<{ data: string; saving: boolean }> {
    private codeMirror?: CodeMirror.Editor;

    constructor() {
        super();
        fetch(`${API_HOST}/trade-fine?token=${getUrlParams()?.token}`)
            .then((r) => {
                if (r.status === 200) {
                    return r.text();
                } else {
                    throw new Error(r.status + " " + r.statusText);
                }
            })
            .then((j) => {
                this.setState({ data: j });
            });
    }
    override componentDidUpdate() {
        if (this.codeMirror) {
            return;
        }
        const editor = document.getElementById("editor");
        if (editor) {
            this.codeMirror = CodeMirror(editor, {
                value: this.state.data,
                mode: "application/json",
                keyMap: "sublime",
                lineNumbers: true,
                indentUnit: 2,
                smartIndent: false,
                tabSize: 2,
                indentWithTabs: false,
            });
        }
    }
    render() {
        if (!this.state.data) {
            return null;
        }
        return (
            <div className="mobile">
                <div id="editor"></div>
                <br />
                <button
                    disabled={this.state.saving}
                    onClick={async () => {
                        if (!this.codeMirror) {
                            alert("Code Mirror is not initialized!");
                            return;
                        }
                        this.setState({ saving: true });
                        try {
                            const resp = await fetch(`${API_HOST}/trade-fine?token=${getUrlParams()?.token}`, {
                                method: "put",
                                body: this.codeMirror.getValue(),
                                headers: { "Content-Type": "application/json" },
                            });
                            const text = await resp.text();
                            this.setState({ data: text });
                            this.codeMirror.setValue(text);
                        } catch (error) {
                            alert(error);
                        } finally {
                            this.setState({ saving: false });
                        }
                    }}
                >
                    Save
                </button>
            </div>
        );
    }
}
