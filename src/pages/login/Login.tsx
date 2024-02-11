import { Input, Flex, Button, Form, message } from "antd";
import { apiPostRequest } from "../../network";

const { Password } = Input;
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

type LoginProps = {
    onSuccess: () => void
};

type LoginValues = {
    username: string,
    password: string
};

export default function Login(props: LoginProps) {
    const { onSuccess } = props;

    const [messageApi, contextHolder] = message.useMessage();

    const navigate = useNavigate();

    const login = async (values: LoginValues) => {
        const res = await apiPostRequest("login", {
            username: values.username,
            password: values.password
        });

        if (res.status == 200) {
            const data = (await res.json());
            console.log(data);

            localStorage.setItem("token", data.token);
            localStorage.setItem("username", values.username);

            onSuccess();
        } else {
            messageApi.error("Failed to login!");
        }
    }


    useEffect(() => {
        if (localStorage.getItem("token")) {
            navigate('/home');
        }
    })

    return (
        <Flex justify="center" align="center" vertical style={{ marginTop: 15 }}>
            {contextHolder}
            <Form
                name="login"
                onFinish={login}
                autoComplete="off"
            >
                <Form.Item
                    label="Username"
                    name="username"
                    rules={[{ required: true, message: 'Please input your username!' }]}
                >
                    <Input autoCapitalize="off"/>
                </Form.Item>

                <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: 'Please input your password!' }]}
                >
                    <Password />
                </Form.Item>
                <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                    <Button type="primary" htmlType="submit">
                        Log in or Sign Up
                    </Button>
                </Form.Item>
            </Form>
        </Flex>
    );
}