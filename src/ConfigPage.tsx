import { Component } from "preact";
import { API_HOST } from "./Constants";
import { getUrlParams } from "./Helper";

export class ConfigPage extends Component<{}, { config: string; saving: boolean }> {
    constructor() {
        super();
        fetch(`${API_HOST}/config?token=${getUrlParams()?.token}`)
            .then((r) => {
                if (r.status === 200) {
                    return r.text();
                } else {
                    throw new Error(r.status + " " + r.statusText);
                }
            })
            .then((j) => {
                this.setState({ config: j });
            });
    }
    render() {
        if (!this.state.config) {
            return null;
        }
        return (
            <>
                <textarea
                    class="edit-config"
                    onInput={(e) => {
                        this.setState({ config: (e.target as HTMLTextAreaElement).value });
                    }}
                >
                    {this.state.config}
                </textarea>
                <button
                    disabled={this.state.saving}
                    onClick={async () => {
                        this.setState({ saving: true });
                        try {
                            await fetch(`${API_HOST}/config?token=${getUrlParams()?.token}`, {
                                method: "post",
                                body: this.state.config,
                                headers: { "Content-Type": "text/plain" },
                            });
                            if (confirm("Config saved, open live config?")) {
                                openLiveConfig();
                            }
                        } catch (error) {
                            alert(error);
                        } finally {
                            this.setState({ saving: false });
                        }
                    }}
                >
                    Save
                </button>{" "}
                <button
                    onClick={() => {
                        openLiveConfig();
                    }}
                >
                    Live Config
                </button>
            </>
        );
    }
}

function openLiveConfig() {
    window.open(`${API_HOST}/config-live?token=${getUrlParams()?.token}`, "_blank");
}
