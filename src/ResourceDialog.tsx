import { Component } from "preact";
import { nf } from "./Helper";

export class ResourceDialog extends Component<{ entry: any; onClose: () => void }> {
    override render() {
        if (!this.props.entry) {
            return null;
        }
        const platformId = this.props.entry.platformId ? (
            <button
                onClick={async () => {
                    navigator.clipboard.writeText(this.props.entry.platformId);
                }}
            >
                {this.props.entry.platformId.toUpperCase()}
            </button>
        ) : null;
        const toolbar = (
            <div>
                {platformId} <button onClick={() => this.props.onClose()}>Close</button>
            </div>
        );
        return (
            <dialog open>
                {toolbar}
                <table class="mb10 mt10">
                    <tr>
                        <th>Resource</th>
                        <th>Amount (Before)</th>
                        <th>Amount (After)</th>
                        <th>Amount (%)</th>
                    </tr>
                    {Object.keys(this.props.entry.after.res).map((k) => {
                        const delta =
                            (100 * (this.props.entry.after.res[k] - this.props.entry.before.res[k])) /
                            this.props.entry.before.res[k];
                        return (
                            <tr>
                                <td>{k}</td>
                                <td>
                                    {nf(this.props.entry.before.res[k] ?? 0)}
                                    <br />
                                    <code>{this.props.entry.before.res[k]}</code>
                                </td>
                                <td>
                                    {nf(this.props.entry.after.res[k])}
                                    <br />
                                    <code>{this.props.entry.after.res[k]}</code>
                                </td>
                                <td class={Math.abs(delta) > 10 ? "red" : ""}>{Math.round(delta)}%</td>
                            </tr>
                        );
                    })}
                </table>
                {toolbar}
            </dialog>
        );
    }
}
