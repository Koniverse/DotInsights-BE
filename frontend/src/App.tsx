import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { Button, Table } from "antd";
import axios from "axios";
import projects from "./project.json";

export const BASE_URL = "http://localhost:5000/api";

function App() {
  const [address, setAddress] = useState();
  const [wallet, setWallet] = useState<any>();
  const [signMesssage, setSignMesssage] = useState();
  const [columnData, setColumnData] = useState([]);

  const connectWallet = async () => {
    const wallet = (window as any).SubWallet;

    if (!wallet || !wallet.isSubWallet) {
      console.warn("SubWallet is not installed");
    }
    try {
      const accounts = await wallet.enable();
      console.log(accounts);
      setWallet(wallet)
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
      },
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
    console.log(data);
  };

  const callVoteProject = async (projectId: string, signature: string) => {
    const { data } = await axios({
      baseURL: BASE_URL,
      url: "/voteProject",
      method: "post",
      data: {
        projectId,
        signature, 
        address
      },
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
    console.log(data);
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
      if(!el.vote) el.vote= 0
      return el;
    });
    console.log(newData);

    setColumnData(newData);
    console.log(data);
  };

  useEffect(() => {
    if (address) {
      getSignMesssage();
    }
  }, [address]);

  useEffect(() => {
    getProject();
  }, []);

  const voteProject = async (projectId: string) => {
    if (wallet) {
      console.log(projectId);
      const signature = await wallet.request({
        method: "personal_sign",
        params: [ signMesssage, address ],
      });
      console.log(signature);
       const resCall = await callVoteProject(projectId, signature)
       console.log(resCall);
       getProject()
    } else {
      console.log("please connect");
    }
  };

  const dataSource = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Vote", dataIndex: "vote", key: "vote" },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (_: any, record: any) => (
        <Button type="primary" onClick={() => voteProject(record._id)}>
          Vote
        </Button>
      ),
    },
  ];

  return (
    <div className="App">
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
