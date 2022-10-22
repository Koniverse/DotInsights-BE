import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { Button, Table, Input } from "antd";
import axios from "axios";
import projects from "./project.json";

export const BASE_URL = "http://localhost:5000/api";

function App() {
  const [address, setAddress] = useState();
  const [wallet, setWallet] = useState<any>();
  const [signMesssage, setSignMesssage] = useState();
  const [columnData, setColumnData] = useState([]);
  const [votedProject, setVotedProject] = useState([]);
  const [valueKey, setValueKey] = useState("");

  const connectWallet = async () => {
    const wallet = (window as any).SubWallet;

    if (!wallet || !wallet.isSubWallet) {
      console.warn("SubWallet is not installed");
    }
    try {
      const accounts = await wallet.enable();
      console.log(accounts);
      setWallet(wallet);
      setAddress(accounts[0]);
    } catch (e) {
      // Response an error with code 4001 when the user rejects the request
      console.log(e);
    }
  };

  const getSignMesssage = async () => {
    const { data } = await axios({
      baseURL: BASE_URL,
      url: "/getMessage",
      method: "post",
      data: {
        address,
      },
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
    setSignMesssage(data.message);
    console.log(data);
  };

  const addProject = async () => {
    const { data } = await axios({
      baseURL: BASE_URL,
      url: "/addProjects",
      method: "post",
      data: {
        projects,
        apiKey: valueKey
      },
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
    console.log(data);
  };

  const callVoteProject = async (
    project_id: string,
    signature: string,
    isVote: boolean
  ) => {
    const { data } = await axios({
      baseURL: BASE_URL,
      url: "/voteProject",
      method: "post",
      data: {
        project_id,
        signature,
        address,
        isVote,
      },
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
    console.log(data);
  };

  const getVotedProject = async () => {
    const { data } = await axios({
      baseURL: BASE_URL,
      url: "/getVotedProject",
      method: "post",
      data: {
        address,
      },
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
    const obj = data.reduce(function (acc: any, cur: any, i: number) {
      acc[cur] = true;
      return acc;
    }, {});
    setVotedProject(obj);
    console.log(obj);
  };

  const getProject = async () => {
    const { data } = await axios({
      baseURL: BASE_URL,
      url: "/getProjects",
      method: "get",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
    const newData = data.projects.map((el: any) => {
      el.key = el._id;
      const project = projects.find(
        (ele: any) => ele.project_id === el.project_id
      );
      if (!el.voteCount) el.voteCount = 0;
      return { ...el, ...project };
    });
    if (address) {
      getVotedProject();
    }
    setColumnData(newData);
  };

  useEffect(() => {
    if (address) {
      getSignMesssage();
      getVotedProject();
    }
  }, [address]);

  useEffect(() => {
    getProject();
  }, []);

  const voteProject = async (project_id: string, isVote: boolean) => {
    if (wallet) {
      console.log(project_id);
      const signature = await wallet.request({
        method: "personal_sign",
        params: [signMesssage, address],
      });
      console.log(signature);
      const resCall = await callVoteProject(project_id, signature, isVote);
      getProject();
    } else {
      console.log("please connect");
    }
  };

  const dataSource = [
    { title: "Name", dataIndex: "project", key: "project" },
    { title: "Vote", dataIndex: "voteCount", key: "voteCount" },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (_: any, record: any) =>
        votedProject[record.project_id] ? (
          <Button
            type="primary"
            onClick={() => voteProject(record.project_id, true)}
          >
            Vote
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={() => voteProject(record.project_id, false)}
          >
            Unvote
          </Button>
        ),
    },
  ];

  return (
    <div className="App">
      <Input size="large"  placeholder="API key" onChange={(e) => setValueKey(e.target.value)}></Input>
      <Button type="primary" onClick={connectWallet}>
        Connect Wallet
      </Button>
      <Button type="primary" onClick={addProject}>
        Add Projects
      </Button>
      <Table dataSource={columnData} columns={dataSource} />;
    </div>
  );
}

export default App;
