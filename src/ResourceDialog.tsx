import { Component } from "preact";
import { nf } from "./Helper";

export class ResourceDialog extends Component<{ entries: any; onClose: () => void; highlightTime: number | null }> {
    override render() {
        if (!this.props.entries) {
            return null;
        }
        const platformId = this.props.entries[0].platformId ? (
            <button
                onClick={async () => {
                    navigator.clipboard.writeText(this.props.entries[0].platformId);
                }}
            >
                {this.props.entries[0].platformId.toUpperCase()}
            </button>
        ) : null;
        const toolbar = (
            <div>
                {platformId} <button onClick={() => this.props.onClose()}>Close</button>
            </div>
        );
        const resources = this.props.entries[0].after.res;
        const sorted = this.props.entries.slice(0).reverse();
        return (
            <dialog open>
                {toolbar}
                <table class="mb10 mt10">
                    <tr>
                        <th>Resource</th>
                        {sorted.map((entry: any) => {
                            const highlightedClass =
                                sorted.length > 1 && this.props.highlightTime === entry.createdAt
                                    ? "highlighted text-center"
                                    : "text-center";
                            return (
                                <th colSpan={3} class={highlightedClass}>
                                    {new Date(entry.createdAt).toLocaleString()}
                                </th>
                            );
                        })}
                    </tr>
                    {Object.keys(resources).map((resource: any) => {
                        return (
                            <tr>
                                <td>{resource}</td>
                                {sorted.map((entry: any, index: number) => {
                                    const diff = Math.round(
                                        (100 * (entry.after.res[resource] - entry.before.res[resource])) /
                                            entry.before.res[resource]
                                    );
                                    return (
                                        <>
                                            <td title={entry.before.res[resource]}>{nf(entry.before.res[resource])}</td>
                                            <td title={entry.after.res[resource]}>{nf(entry.after.res[resource])}</td>
                                            <td class={Math.abs(diff) > 10 ? "red" : ""}>{diff}%</td>
                                        </>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </table>
                {toolbar}
            </dialog>
        );
    }
}
