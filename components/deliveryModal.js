import Airtable from "airtable";
import { Button, Col, Form, Input, Modal, Radio, Row, Select } from "antd";
import { useState } from "react";
import { Status } from "../pages/list";

export const DeliveryModal = ({
  showDeliveryModal,
  handleClose,
  fileValue,
  callback,
}) => {
  const airtableUserBase = new Airtable({
    apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
  }).base("app6aPGOFXFVaykGO");
  const fileTableList = airtableUserBase("File List");

  const [deliveryForm] = Form.useForm();

  const [selectValue, setselectValue] = useState("");
  const [selectRadioValue, setselectRadioValue] = useState("");

  const onFinish = async (values) => {
    const user = JSON.parse(localStorage.getItem("kunUser"));
    console.log("values", values, user);
    let data = {
      status: values.status,
      ["Reported By"]: user.name,
      ["Reported By Contact"]: user.contact,
    };
    if (values.noZiyaratReason) {
      data["Reason for No Ziyaraat"] = values.noZiyaratReason;
    }
    if (values.ziyaratStatus) {
      data["Ziyaraat_status"] = values.ziyaratStatus;
    }
    if (values.yearofZiyarat) {
      data["Year of Ziyarat"] = Number(values.yearofZiyarat);
    }
    await fileTableList.update(
      [
        {
          id: fileValue.id,
          fields: data,
        },
      ],
      function (err) {
        if (err) {
          console.error(err);
          return;
        }
      }
    );

    await callback();
    handleClose();
  };

  const handleSelectChange = (e) => {
    setselectValue(e);
  };

  const handleRadioSelectChange = (e) => {
    setselectRadioValue(e.target.value);
  };

  return (
    <Modal
      title="Update Delivery Status"
      visible={showDeliveryModal}
      onCancel={handleClose}
      footer={null}
    >
      <Row className="mb-8" gutter={[4, 4]}>
        <Col xs={24}>
          <span className="text-xs">Name</span>
          <p className="text-sm">{fileValue.full_name}</p>
        </Col>
        <Col xs={12}>
          <span className="text-xs">Age</span>
          <p className="text-sm">{fileValue.Age}</p>
        </Col>
        <Col xs={12}>
          <span className="text-xs">File Number</span>
          <p className="text-sm">{fileValue.file_number}</p>
        </Col>
        <Col xs={12}>
          <span className="text-xs">Building</span>
          <p className="text-sm">{fileValue.Building}</p>
        </Col>
      </Row>
      <Form
        name="deliveryStatus"
        form={deliveryForm}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          label="Status"
          name="status"
          rules={[
            {
              required: true,
              message: "Please select status",
            },
          ]}
        >
          <Select onChange={handleSelectChange}>
            <Select.Option value={Status.callAgain.status}>
              {Status.callAgain.status}
            </Select.Option>
            <Select.Option value={Status.called.status}>
              {Status.called.status}
            </Select.Option>
            <Select.Option value={Status.notContactable.status}>
              {Status.notContactable.status}
            </Select.Option>
          </Select>
        </Form.Item>

        {selectValue === Status.called.status ? (
          <Form.Item
            label="Is Ziyarat Done?"
            name="ziyaratStatus"
            rules={[
              {
                required: true,
                message: "Please select ziyarat status!",
              },
            ]}
          >
            <Radio.Group onChange={handleRadioSelectChange}>
              <Radio value="Done">Done</Radio>
              <Radio value="Not Done">Not Done</Radio>
            </Radio.Group>
          </Form.Item>
        ) : null}

        {selectValue === Status.called.status &&
        selectRadioValue === "Not Done" ? (
          <Form.Item
            label="Reason for no ziyarat?"
            name="noZiyaratReason"
            rules={[
              {
                required: true,
                message: "Please enter reason for no ziyarat!",
              },
            ]}
          >
            <Select>
              <Select.Option value="Imkaan Nathi Thayu">
                Imkaan Nathi Thayu
              </Select.Option>
              <Select.Option value="Cannot Go Alone">
                Cannot Go Alone
              </Select.Option>
              <Select.Option value="Financial Reason">
                Financial Reason
              </Select.Option>
              <Select.Option value="Medical Reason">
                Medical Reason
              </Select.Option>
              <Select.Option value="No Passport">No Passport</Select.Option>
              <Select.Option value="Planning Shortly">
                Planning Shortly
              </Select.Option>
            </Select>
          </Form.Item>
        ) : null}

        {selectValue === Status.called.status && selectRadioValue === "Done" ? (
          <Form.Item
            label="Year of Ziyarat"
            name="yearofZiyarat"
            rules={[
              {
                required: true,
                message: "Please enter year of ziyarat!",
              },
              {
                max: 4,
                message: "Please enter valid year!",
              },
              () => ({
                validator(_, value) {
                  if (!value || !isNaN(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Please enter valid year!"));
                },
              }),
            ]}
          >
            <Input />
          </Form.Item>
        ) : null}

        <Form.Item>
          <Button
            className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 border-none"
            type="primary"
            htmlType="submit"
          >
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
