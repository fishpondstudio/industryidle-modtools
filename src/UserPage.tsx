import { getUrlParams, nf } from "./Helper";
import { Page } from "./Page";

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
        console.log(this.state.entries, this.state.user);
        if (!this.state.entries || !this.state.user) {
            return null;
        }
        return (
            <div className="mobile">
                <table>
                    {this.state.entries.map((entry) => {
                        return (
                            <>
                                <tr>
                                    <th colSpan={4}>{new Date(entry.createdAt).toLocaleString()}</th>
                                </tr>
                                {Object.keys(entry.after.res).map((res) => {
                                    const delta = entry.before.res[res]
                                        ? Math.round(
                                              (100 * (entry.after.res[res] - entry.before.res[res])) /
                                                  entry.before.res[res]
                                          )
                                        : 0;
                                    if (Math.abs(delta) <= 5) {
                                        return;
                                    }
                                    return (
                                        <tr>
                                            <td>{res}</td>
                                            <td title={entry.before.res[res]}>{nf(entry.before.res[res])}</td>
                                            <td title={entry.after.res[res]}>{nf(entry.after.res[res])}</td>
                                            <td class="red">{delta}%</td>
                                        </tr>
                                    );
                                })}
                            </>
                        );
                    })}
                </table>
            </div>
        );
    }
}
