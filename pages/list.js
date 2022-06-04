import { Button, Card, Col, Layout, Modal, Row, Spin } from "antd";
import Head from "next/head";
import { useEffect, useState } from "react";
import { FiAlertCircle, FiXCircle, FiCheckCircle } from "react-icons/fi";
import { FaPhoneAlt, FaWhatsapp } from "react-icons/fa";
import Airtable from "airtable";
import { useRouter } from "next/router";
import { DeliveryModal } from "../components/deliveryModal";
import { groupBy, orderBy } from "lodash";

const { Header, Content } = Layout;

export class Status {
  // Create new instances of the same class as static attributes
  static called = new Status("Called");
  static toBeCalled = new Status("To Be Called");
  static callAgain = new Status("Call Again");
  static notContactable = new Status("Not Contactable");

  constructor(name) {
    this.status = name;
  }
}

export const zoneColors = {
  BADRI: "#A9D18E",
  BURHANI: "#9954CC",
  EZZI: "#FF75AD",
  FATEMI: "#FFC000",
  HAKIMI: "#4472C4",
  JAMALI: "#AFABAB",
  MOHAMMEDI: "#767171",
  NAJMI: "#D3E210",
  SAIFEE: "#8FAADC",
  SHUJAYI: "#00B050",
  VAJIHI: "#C55A11",
  ZAINEE: "#5B9BD5",
};

function getRandomColor() {
  let color = "hsl(" + Math.random() * 360 + ", 100%, 75%)";
  return color;
}

const ListPage = () => {
  const airtableUserBase = new Airtable({
    apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
  }).base("app6aPGOFXFVaykGO");
  const fileTableList = airtableUserBase("File List");

  const router = useRouter();

  const [userDetails, setUserDetails] = useState({});
  const [zoneDetails, setZoneDetails] = useState([]);
  const [fileDetails, setFileDetails] = useState([]);
  const [selectedFile, setSelectedFile] = useState({});
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [displayLoader, setDisplayLoader] = useState(true);
  const [activeState, setActiveState] = useState(Status.toBeCalled.status);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("kunUser"));
    if (!user) {
      router.push("/");
    } else {
      setUserDetails(user);
      getFileListBySubSector(user.zone[0]);
    }
  }, []);

  useEffect(() => {
    if (zoneDetails.length > 0) {
      getFileDetails(zoneDetails);
    }
  }, [zoneDetails]);

  const getFileListBySubSector = async (zone) => {
    const finalData = [];
    setDisplayLoader(true);
    await fileTableList
      .select({
        maxRecords: 1200,
        view: "Grid view",
        filterByFormula: `({Zone} = '${zone}')`,
      })
      .eachPage(
        function page(records, fetchNextPage) {
          records.forEach(function (record) {
            finalData.push(record);
          });

          fetchNextPage();
        },
        function done(err) {
          setZoneDetails(
            finalData.map((val) => ({ ...val.fields, id: val.id }))
          );
          setDisplayLoader(false);

          if (err) {
            console.error(err);
            return;
          }
        }
      );
  };

  const getFileDetails = (data) => {
    let userRole = userDetails.userRole;
    let sectorFileData =
      userRole === "Masool"
        ? data
        : data.filter((val) => userDetails.assignedArea.includes(val.Building));
    setFileDetails(sectorFileData);
  };

  const handleShowDeliveryModal = (fileValue) => {
    setSelectedFile(fileValue);
    setShowDeliveryModal(true);
  };

  const handleLogout = () => {
    const user = JSON.parse(localStorage.getItem("kunUser"));
    if (user) {
      localStorage.clear();
      router.push("/");
    }
  };

  const getSectorName = () => {
    return userDetails
      ? userDetails.userRole === "Masool"
        ? userDetails.zone[0]
        : userDetails.assignedArea && userDetails.assignedArea.join(" , ")
      : "";
  };

  const handleWaclick = (waNumber) => {
    window.open(`https://wa.me/${waNumber}`, "_blank", "noopener,noreferrer");
  };
  const handleCall = (callNumber) => {
    window.open(`tel:${callNumber}`);
  };

  const renderFileCards = () => {
    let filteredFileList = orderBy(
      fileDetails.filter((val) => val.status === activeState),
      ["file_number"],
      ["asc"]
    );

    let buildingWiseFiles = groupBy(filteredFileList, "Building");
    let fileList = Object.keys(buildingWiseFiles).map((key) => {
      let fileWiseList = groupBy(buildingWiseFiles[key], "file_number");
      let fileWiseListKeys = Object.keys(fileWiseList).map(
        (key) => fileWiseList[key]
      );
      return fileWiseListKeys;
    });
    return Object.keys(buildingWiseFiles).map((key, index) => {
      return (
        <div key={key}>
          <h1 className="text-lg my-2">{key}</h1>
          {fileList[index].map((list) => {
            let bgColor = getRandomColor();
            return list.map((val) => (
              <Card
                key={val.id}
                className=" padding-0-card rounded-lg mb-2"
                style={{ backgroundColor: bgColor }}
              >
                <div className="flex px-2 py-2">
                  <div className="flex flex-col flex-grow">
                    <Row gutter={[8, 8]}>
                      <Col xs={24}>
                        <span className="text-xs">Name</span>
                        <p className="text-sm">{val.full_name}</p>
                      </Col>
                      <Col xs={24}>
                        <span className="text-xs">Mobile Number</span>
                        <div className="flex items-center">
                          <p className="text-sm">{val.Contact}</p>
                          <span
                            onClick={() => handleWaclick(val.Contact)}
                            className="text-lg ml-4"
                          >
                            <FaWhatsapp />
                          </span>
                          <span
                            onClick={() => handleCall(val.Contact)}
                            className="text-lg ml-4"
                          >
                            <FaPhoneAlt />
                          </span>
                        </div>
                      </Col>
                      <Col xs={8}>
                        <span className="text-xs">Age</span>
                        <p className="text-sm">{val.Age}</p>
                      </Col>
                      <Col xs={12}>
                        <span className="text-xs">File No</span>
                        <p className="text-sm">{val.file_number}</p>
                      </Col>
                      <Col xs={12}>
                        <span className="text-xs">Building</span>
                        <p className="text-sm">{val.Building}</p>
                      </Col>
                      <Col xs={24}>
                        <span className="text-xs">HOF Name</span>
                        <p className="text-sm">{val.hof_name}</p>
                      </Col>
                      <Col xs={12}>
                        <span className="text-xs">HOF Contact</span>
                        <div className="flex items-center">
                          <p className="text-sm">{val.hof_contact}</p>
                          <span
                            onClick={() => handleWaclick(val.hof_contact)}
                            className="text-lg ml-4"
                          >
                            <FaWhatsapp />
                          </span>
                          <span
                            onClick={() => handleCall(val.hof_contact)}
                            className="text-lg ml-4"
                          >
                            <FaPhoneAlt />
                          </span>
                        </div>
                      </Col>
                    </Row>
                  </div>
                  <div className="ml-4">
                    <Button
                      className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white border border-blue-500 hover:border-transparent rounded"
                      // type="primary"
                      disabled={
                        val.status === Status.called.status ||
                        val.status === Status.notContactable.status
                      }
                      onClick={() => handleShowDeliveryModal(val)}
                    >
                      status
                    </Button>
                  </div>
                </div>
              </Card>
            ));
          })}
        </div>
      );
    });
  };

  return (
    <Layout className="min-h-screen overflow-y-auto ">
      <Head>
        <title>Kunsafar Survey</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header className="h-20 p-0 flex px-4 items-center">
        <p className="whitespace-nowrap text-lg text-white text-ellipsis overflow-hidden flex-grow">
          {userDetails.name}
        </p>
        <Button
          onClick={handleLogout}
          className="ml-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
        >
          Logout
        </Button>
      </Header>
      {displayLoader ? (
        <div className="fixed z-50 top-0 left-0 w-screen h-screen bg-white/70 flex items-center justify-center">
          <Spin size="large" />
        </div>
      ) : null}
      <Content className="px-4 py-6">
        <div className="w-full">
          <div className="w-full flex items-start mb-8">
            <h3 className="text-2xl">Sectors</h3>
            <h3 className="text-2xl mx-1">:</h3>
            <p className="flex-grow text-xl mt-1">{getSectorName()}</p>
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={8} lg={6} xl={4}>
              <Card
                style={{
                  backgroundColor:
                    activeState === Status.toBeCalled.status
                      ? "#dddddd"
                      : "#ffffff",
                }}
                onClick={() => setActiveState(Status.toBeCalled.status)}
                className="p-0 rounded-lg"
              >
                <p className="text-sm text-center mb-2">To Be Called</p>
                <div className="flex">
                  <span className="flex items-center justify-center w-12 text-5xl mr-4 text-indigo-500">
                    <FiAlertCircle />
                  </span>
                  <div className="flex flex-col flex-grow">
                    <p className="text-4xl text-indigo-500">
                      {
                        fileDetails.filter(
                          (val) =>
                            !val.status ||
                            val.status === Status.toBeCalled.status
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} md={8} lg={6} xl={4}>
              <Card
                style={{
                  backgroundColor:
                    activeState === Status.callAgain.status
                      ? "#dddddd"
                      : "#ffffff",
                }}
                onClick={() => setActiveState(Status.callAgain.status)}
                className="p-0 rounded-lg"
              >
                <p className="text-sm text-center mb-2">Call Again</p>
                <div className="flex">
                  <div className="flex items-center justify-center w-12 text-5xl mr-4 text-amber-600">
                    <FiCheckCircle />
                  </div>
                  <div className="flex flex-col flex-grow">
                    <p className="text-4xl text-amber-600">
                      {
                        fileDetails.filter(
                          (val) => val.status === Status.callAgain.status
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} md={8} lg={6} xl={4}>
              <Card
                style={{
                  backgroundColor:
                    activeState === Status.called.status
                      ? "#dddddd"
                      : "#ffffff",
                }}
                onClick={() => setActiveState(Status.called.status)}
                className="p-0 rounded-lg"
              >
                <p className="text-sm text-center mb-2">Called</p>
                <div className="flex">
                  <div className="flex items-center justify-center w-12 text-5xl mr-4 text-lime-600">
                    <FiCheckCircle />
                  </div>
                  <div className="flex flex-col flex-grow">
                    <p className="text-4xl text-lime-600">
                      {
                        fileDetails.filter(
                          (val) => val.status === Status.called.status
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} md={8} lg={6} xl={4}>
              <Card
                style={{
                  backgroundColor:
                    activeState === Status.notContactable.status
                      ? "#dddddd"
                      : "#ffffff",
                }}
                onClick={() => setActiveState(Status.notContactable.status)}
                className="p-0 rounded-lg"
              >
                <p className="text-sm text-center mb-2">Not Contactable</p>
                <div className="flex">
                  <div className="flex items-center justify-center w-12 text-5xl mr-4 text-red-600">
                    <FiXCircle />
                  </div>
                  <div className="flex flex-col flex-grow">
                    <p className="text-4xl text-red-600">
                      {
                        fileDetails.filter(
                          (val) => val.status === Status.notContactable.status
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* add search logic */}

          <div className="w-full flex items-start my-8">
            <h3 className="text-2xl">{activeState + " List"}</h3>
            <h3 className="text-2xl mx-1">:</h3>
          </div>

          {renderFileCards()}
        </div>
      </Content>
      {showDeliveryModal ? (
        <DeliveryModal
          showDeliveryModal={showDeliveryModal}
          handleClose={() => setShowDeliveryModal(false)}
          fileValue={selectedFile}
          callback={async () => {
            await getFileListBySubSector(userDetails.zone[0]);
          }}
        />
      ) : null}
    </Layout>
  );
};

export default ListPage;
