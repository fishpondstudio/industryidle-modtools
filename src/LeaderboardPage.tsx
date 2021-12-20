import { Component } from "preact";
import { getUrlParams, nf } from "./Helper";

interface ILeaderboard {
    _id?: string;
    allPrestigeCurrency: number;
    buildingCount: number;
    buildingValuation: number;
    cash: number;
    dlc: boolean;
    flag: string;
    map: string;
    mapCreatedAt: number;
    prestigeCurrency: number;
    resourceValuation: number;
    userName: string;
}

export class LeaderboardPage extends Component<{}, { leaderboards: { updatedAt: number; data: ILeaderboard[] }[] }> {
    constructor() {
        super();
        this.loadData();
    }

    async loadData() {
        fetch(`https://couchdb-de.fishpondstudio.com/industryidle_lblog/_find`, {
            headers: { Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`, "Content-Type": "application/json" },
            method: "post",
            body: JSON.stringify({
                selector: {},
                sort: [{ updatedAt: "desc" }],
                limit: 15,
            }),
        })
            .then((r) => {
                if (r.status === 200) {
                    return r.json();
                } else {
                    throw new Error(r.status + " " + r.statusText);
                }
            })
            .then((j) => {
                this.setState({ leaderboards: j.docs });
            });
    }

    render() {
        if (!this.state.leaderboards) {
            return;
        }

        const idx: Record<number, Record<string, [string, number, number]>> = {};

        this.state.leaderboards.forEach((l, index) => {
            if (!idx[index]) {
                idx[index] = {};
            }
            l.data.forEach((f, i) => {
                idx[index][f._id ?? f.userName] = [f.userName, f.resourceValuation + f.buildingValuation, i + 1];
            });
        });

        return (
            <table>
                <tr>
                    <th></th>
                    {this.state.leaderboards.map((d) => {
                        return (
                            <th colSpan={2} class="text-center">
                                -{Math.floor((10 * (Date.now() - d.updatedAt)) / (1000 * 60 * 60)) / 10}h
                            </th>
                        );
                    })}
                </tr>
                {this.state.leaderboards[0].data.map((d) => {
                    return (
                        <tr>
                            <td
                                className={d.dlc ? "pointer" : "pointer bold"}
                                onClick={() => navigator.clipboard.writeText(d._id ?? "")}
                            >
                                {d.userName}
                            </td>
                            {this.state.leaderboards.map((l, index) => {
                                const current = idx[index][d._id ?? d.userName] ?? idx[index][d.userName];
                                const prev = idx[index + 1]
                                    ? idx[index + 1][d._id ?? d.userName] ?? idx[index + 1][d.userName]
                                    : null;
                                return (
                                    <>
                                        <td
                                            class={
                                                current && prev && Math.abs(current[1] - prev[1]) / prev[1] > 0.1
                                                    ? "text-right red"
                                                    : "text-right"
                                            }
                                        >
                                            {current ? nf(current[1]) : ""}
                                        </td>
                                        <td
                                            class={
                                                current && prev && Math.abs(current[2] - prev[2]) > 5
                                                    ? "text-right red"
                                                    : "text-right"
                                            }
                                        >
                                            {current ? nf(current[2]) : ""}
                                        </td>
                                    </>
                                );
                            })}
                        </tr>
                    );
                })}
            </table>
        );
    }
}
