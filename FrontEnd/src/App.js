import { Button, Card, CardContent, CardHeader, Grid } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import React, { Component } from "react";
import "./App.css";
import mainImg from "./main.svg";
import axios from "axios";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import SaveIcon from "@material-ui/icons/Save";

const useStyles = makeStyles((theme) => ({
  root: {
    "& > *": {
      margin: theme.spacing(1),
      width: "25ch",
    },
  },
}));

export default class App extends Component {
  state = {
    img: mainImg,
    analyzing: false,
    notify: false,
    date: "",
    amount: "",
    name: "",
    accNo: "",
  };

  imageHandler = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        this.setState({ img: reader.result });
      }
    };
    reader.readAsDataURL(e.target.files[0]);

    this.setState({
      analyzing: true,
      notify: false,
      date: "",
      amount: "",
      name: "",
      accNo: "",
    });

    let formData = new FormData();
    formData.append("file", e.target.files[0], this.state.img);
    let url = "http://localhost:3002/api/analyze/";
    axios
      .post(url, formData, {
        headers: {
          "content-type": "multipart/form-data",
        },
      })
      .then((res) => {
        this.setState({ analyzing: false });
        console.log(res);
        let rec = res.data.output[0].fields;
        this.setState({
          date: rec.date.value + "/" + rec.month.value + "/" + rec.year.value,
          amount: rec.Amount.value,
          name: rec.Name.value,
          accNo: rec.AccountNo.value,
          notify: true,
        });
      });
  };

  render() {
    const { img, analyzing, name, accNo, date, amount, notify } = this.state;
    return (
      <div className="page">
        <Card className="card">
          <CardHeader
            title="Azure Custom Form Analyzer Example"
            subheader="Using NodeJS Backend and React"
          ></CardHeader>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Button
                  variant="contained"
                  color="default"
                  startIcon={<CloudUploadIcon />}
                  component="label"
                >
                  Upload File
                  <input
                    type="file"
                    name="image-upload"
                    id="input"
                    onChange={this.imageHandler}
                    hidden
                  />
                </Button>
                <br />
                <TransactionForm
                  accNo={accNo}
                  amount={amount}
                  date={date}
                  name={name}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Scanning analyzing={analyzing} />
                <img className="imgMain" alt="Form" src={img} />
                <Alerts notify={notify} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </div>
    );
  }
}

function Scanning(props) {
  if (props.analyzing === true) {
    return <div id="scanner"></div>;
  }
  return <div id="empty"></div>;
}

function TransactionForm(props) {
  const classes = useStyles();

  return (
    <form className={classes.root} noValidate autoComplete="off">
      <label>Transaction Form</label>
      <br></br>
      <TextField
        id="name"
        label="Name"
        size="small"
        value={props.name}
        variant="outlined"
        color="secondary"
      />
      <TextField
        id="accountNo"
        label="Account Number"
        value={props.accNo}
        size="small"
        variant="outlined"
        color="secondary"
      />
      <TextField
        id="date"
        label="Date"
        value={props.date}
        size="small"
        variant="outlined"
        color="secondary"
      />
      <TextField
        id="amount"
        label="Amount"
        value={props.amount}
        size="small"
        variant="outlined"
        color="secondary"
      />
      <Button type="submit" id="btnSubmit" startIcon={<SaveIcon />}>
        Save
      </Button>
    </form>
  );
}

function Alerts(props) {
  const classes = useStyles();

  if (props.notify === true) {
    return (
      <Alert id="alertt" variant="filled" severity="success">
        Form Analysing Successfully Completed !
      </Alert>
    );
  }
  return <div id="empty"></div>;
}
