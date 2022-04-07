import { getUrlParams, nf } from "./Helper";
import { Page } from "./Page";
import { optInOrOut } from "./UserInfoDialog";

export class UserPage extends Page<{ entries: any[]; user: any }> {
    override async componentDidMount() {
        const r = await Promise.all([
            fetch(`https://couchdb-de.fishpondstudio.com/industryidle_anticheat/_find`, {
                headers: {
                    Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                    "Content-Type": "application/json",
                },
                method: "post",
                body: JSON.stringify({
                    selector: {
                        userId: this.props.params.id,
                    },
                    limit: 999,
                }),
            }),
            fetch(`https://couchdb-de.fishpondstudio.com/industryidle_ticks/${this.props.params.id}`, {
                headers: {
                    Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                    "Content-Type": "application/json",
                },
                method: "get",
            }),
        ]);
        this.setState({
            entries: (await r[0].json()).docs.sort((a: any, b: any) => b.createdAt - a.createdAt),
            user: await r[1].json(),
        });
    }

    render() {
        if (!this.state.entries || !this.state.user) {
            return null;
        }
        let steamButton = null;
        if (this.state.user?.platformId?.startsWith?.("steam:")) {
            const steamId = this.state.user.platformId.split(":")[1];
            steamButton = (
                <>
                    <button
                        onClick={() => {
                            window.open(
                                `https://api.fishpondstudio.com/steam/steamid-trusted?steamid=${steamId}`,
                                "_blank"
                            );
                        }}
                    >
                        Steam:{steamId}
                    </button>
                </>
            );
        }
        return (
            <div className="mobile">
                <div class="mb10 bold">
                    {this.state.user.userName} ({this.state.user.dlc}xDLC) {this.state.user.platformId}
                </div>
                <div class="mb10">
                    <button
                        onClick={() => {
                            optInOrOut(this.state.user, true).then((r) => {
                                alert(r.map((v) => `${v.status} ${v.statusText}`).join(", "));
                            });
                        }}
                        disabled={this.state.user.optOut}
                    >
                        Opt Out
                    </button>{" "}
                    <button
                        onClick={() => {
                            optInOrOut(this.state.user, false).then((r) => {
                                alert(r.map((v) => `${v.status} ${v.statusText}`).join(", "));
                            });
                        }}
                        disabled={!this.state.user.optOut}
                    >
                        Opt In
                    </button>{" "}
                    <button
                        onClick={() => {
                            window.open(`https://iplocation.io/ip/${this.state.user.lastIp}`, "_blank");
                        }}
                    >
                        {this.state.user.lastIp}
                    </button>{" "}
                    {steamButton}
                </div>
                <table>
                    {this.state.entries.map((entry) => {
                        return (
                            <>
                                <tr>
                                    <th colSpan={4}>{new Date(entry.createdAt).toLocaleString()}</th>
                                </tr>
                                {Object.keys(entry.after.res).map((res) =>
                                    diffRow(res, entry.before.res[res], entry.after.res[res])
                                )}
                                {diffRow(
                                    "Valuation",
                                    entry.before.resourceValuation + entry.before.buildingValuation,
                                    entry.after.resourceValuation + entry.after.buildingValuation
                                )}
                                {diffRow(
                                    "Swiss",
                                    entry.before.allPrestigeCurrency + entry.before.allPrestigeCurrency,
                                    entry.after.allPrestigeCurrency + entry.after.allPrestigeCurrency
                                )}
                            </>
                        );
                    })}
                </table>
            </div>
        );
    }
}

function diffRow(label: string, before: number, after: number) {
    const delta = before ? Math.round((100 * (after - before)) / before) : 0;
    if (Math.abs(delta) <= 5) {
        return;
    }
    return (
        <tr>
            <td>{label}</td>
            <td title={String(before)}>{nf(before)}</td>
            <td title={String(after)}>{nf(after)}</td>
            <td class={delta >= 50 ? "red" : ""}>{delta}%</td>
        </tr>
    );
}
