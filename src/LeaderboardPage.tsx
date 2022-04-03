import { Component } from "preact";
import { API_HOST } from "./Constants";
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

declare global {
    interface HTMLDialogElement {
        showModal(): void;
        close(): void;
    }
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
        userData: any;
    }
> {
    private dialog: HTMLDialogElement | null = null;

    constructor() {
        super();
        this.loadData();
    }

    async loadData() {
        fetch(`https://couchdb-de.fishpondstudio.com/industryidle_lblog/_find`, {
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

    async deleteLeaderboard(id: string, rev: string) {
        fetch(`https://couchdb-de.fishpondstudio.com/industryidle_lblog/${id}?rev=${rev}`, {
            headers: {
                Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                "Content-Type": "application/json",
            },
            method: "delete",
        }).then((r) => {
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

        let steamButton: JSX.Element | null = null;
        if (this.state.userData?.platformId?.startsWith?.("steam:")) {
            const steamId = this.state.userData.platformId.split(":")[1];
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
                        Steam ID
                    </button>{" "}
                </>
            );
        }
        const toolbar = (
            <>
                <button
                    onClick={async () => {
                        this.state.userData.optOut = true;
                        const userId = this.state.userData._id;
                        const r = await fetch(`https://couchdb-de.fishpondstudio.com/industryidle_ticks/${userId}`, {
                            headers: {
                                Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(this.state.userData),
                            method: "put",
                        });
                        fetch(`${API_HOST}/opt-out?token=${getUrlParams()?.token}&userId=${userId}`);
                        this.dialog?.close();
                        alert(`${r.status} ${r.statusText}`);
                    }}
                >
                    Opt Out
                </button>{" "}
                <button
                    onClick={() => {
                        window.open(
                            `https://api.fishpondstudio.com/trade-token?userId=${this.state.userData._id}&token=${
                                getUrlParams()?.token
                            }`,
                            "_blank"
                        );
                    }}
                >
                    Trade Token
                </button>{" "}
                <button
                    onClick={() => {
                        window.open(`https://iplocation.io/ip/${this.state.userData.lastIp}`, "_blank");
                    }}
                >
                    IP Location
                </button>{" "}
                {steamButton}
                <button
                    onClick={() => {
                        this.dialog?.close();
                    }}
                >
                    Close
                </button>
            </>
        );

        return (
            <>
                <dialog ref={(ref) => (this.dialog = ref)}>
                    {toolbar}
                    <pre>{JSON.stringify(this.state.userData, null, 4)}</pre>
                    {toolbar}
                </dialog>
                <table>
                    <tr>
                        <th>
                            <a
                                href="https://api.fishpondstudio.com/leaderboard/v4?name=byAllPrestigeCurrency"
                                target="_blank"
                            >
                                Reload
                            </a>
                        </th>
                        {this.state.leaderboards.map((d) => {
                            return (
                                <th
                                    class="text-right pointer"
                                    onClick={() => {
                                        if (window.confirm(`Do you want to delete ${d._id} (rev: ${d._rev})`)) {
                                            this.deleteLeaderboard(d._id, d._rev);
                                        }
                                    }}
                                >
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
                                    onClick={async () => {
                                        const r = await fetch(
                                            `https://couchdb-de.fishpondstudio.com/industryidle_ticks/${d._id}`,
                                            {
                                                headers: {
                                                    Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                                                    "Content-Type": "application/json",
                                                },
                                                method: "get",
                                            }
                                        );
                                        const j = await r.json();
                                        this.setState({ userData: j });
                                        this.dialog?.showModal();
                                    }}
                                >
                                    {d.userName}
                                </td>
                                {this.state.leaderboards.map((l, index) => {
                                    const current = idx[index][d._id];
                                    const prev = idx[index + 1] ? idx[index + 1][d._id] : null;
                                    return (
                                        <>
                                            <td
                                                title={
                                                    current
                                                        ? `Rank: ${nf(current.rank)}, Swiss Money: ${nf(
                                                              current.allPrestigeCurrency
                                                          )}`
                                                        : "N/A"
                                                }
                                                class={
                                                    current &&
                                                    prev &&
                                                    Math.abs(current.valuation - prev.valuation) / prev.valuation > 0.1
                                                        ? "text-right red"
                                                        : "text-right"
                                                }
                                            >
                                                {current ? nf(current.valuation) : ""}
                                            </td>
                                        </>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </table>
            </>
        );
    }
}
