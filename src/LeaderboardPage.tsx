import { Component } from "preact";
import { getUrlParams, nf } from "./Helper";

interface ILeaderboard {
    _id: string;
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

interface IUserItem {
    userName: string;
    valuation: number;
    rank: number;
    allPrestigeCurrency: number;
}

export class LeaderboardPage extends Component<
    {},
    {
        leaderboards: {
            _id: string;
            _rev: string;
            updatedAt: number;
            data: ILeaderboard[];
        }[];
    }
> {
    constructor() {
        super();
        this.loadData();
    }

    async loadData() {
        fetch(
            `https://couchdb-de.fishpondstudio.com/industryidle_lblog/_find`,
            {
                headers: {
                    Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                    "Content-Type": "application/json",
                },
                method: "post",
                body: JSON.stringify({
                    selector: {},
                    sort: [{ updatedAt: "desc" }],
                    limit: 20,
                }),
            }
        )
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

    async deleteLeaderboard(id: string, rev: string) {
        fetch(
            `https://couchdb-de.fishpondstudio.com/industryidle_lblog/${id}?rev=${rev}`,
            {
                headers: {
                    Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                    "Content-Type": "application/json",
                },
                method: "delete",
            }
        ).then((r) => {
            if (r.status === 200) {
                this.loadData();
            } else {
                throw new Error(r.status + " " + r.statusText);
            }
        });
    }

    render() {
        if (!this.state.leaderboards) {
            return;
        }

        const idx: Record<number, Record<string, IUserItem>> = {};

        this.state.leaderboards.forEach((l, index) => {
            if (!idx[index]) {
                idx[index] = {};
            }
            l.data.forEach((f, i) => {
                idx[index][f._id] = {
                    userName: f.userName,
                    valuation: f.resourceValuation + f.buildingValuation,
                    allPrestigeCurrency: f.allPrestigeCurrency,
                    rank: i + 1,
                };
                [f.userName, f.resourceValuation + f.buildingValuation, i + 1];
            });
        });

        return (
            <table>
                <tr>
                    <th></th>
                    {this.state.leaderboards.map((d) => {
                        return (
                            <th
                                class="text-right pointer"
                                onClick={() => {
                                    if (
                                        window.confirm(
                                            `Do you want to delete ${d._id} (rev: ${d._rev})`
                                        )
                                    ) {
                                        this.deleteLeaderboard(d._id, d._rev);
                                    }
                                }}
                            >
                                -
                                {Math.floor(
                                    (10 * (Date.now() - d.updatedAt)) /
                                        (1000 * 60 * 60)
                                ) / 10}
                                h
                            </th>
                        );
                    })}
                </tr>
                {this.state.leaderboards[0].data.map((d) => {
                    return (
                        <tr>
                            <td
                                className={d.dlc ? "pointer" : "pointer bold"}
                                onClick={() =>
                                    navigator.clipboard.writeText(d._id ?? "")
                                }
                            >
                                {d.userName}
                            </td>
                            {this.state.leaderboards.map((l, index) => {
                                const current = idx[index][d._id];
                                const prev = idx[index + 1]
                                    ? idx[index + 1][d._id]
                                    : null;
                                return (
                                    <>
                                        <td
                                            title={
                                                current
                                                    ? `Rank: ${nf(
                                                          current.rank
                                                      )}, Swiss Money: ${nf(
                                                          current.allPrestigeCurrency
                                                      )}`
                                                    : "N/A"
                                            }
                                            class={
                                                current &&
                                                prev &&
                                                Math.abs(
                                                    current.valuation -
                                                        prev.valuation
                                                ) /
                                                    prev.valuation >
                                                    0.1
                                                    ? "text-right red"
                                                    : "text-right"
                                            }
                                        >
                                            {current
                                                ? nf(current.valuation)
                                                : ""}
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
