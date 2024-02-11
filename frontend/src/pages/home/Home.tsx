import { useEffect, useState } from "react";

import { Flex, List, Avatar, Button } from "antd";
import { UserAddOutlined, CaretRightFilled, BuildOutlined } from "@ant-design/icons";

import { Link, useNavigate } from "react-router-dom";

import UserSelect from "../../components/FindUsers";
import { User, UserStatus } from "../../types/User";
import { apiPostRequest } from "../../network";

export default function Home() {
    const [foundUsers, setFoundUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [addUserModalOpen, setAddUserModalOpen] = useState<boolean>(false);

    const navigate = useNavigate();

    useEffect(() => {
        function getContacts() {
            apiPostRequest("contacts", {}).then(r => r.json()).then(data => {
                setLoading(false);
                setFoundUsers(data.map((user: any) => {
                    const status = UserStatus[user.status as keyof typeof UserStatus];
                    return ({
                        username: user.username,
                        status: status
                    } satisfies User);
                }));
            });
        }
        
        const contactsInterval = setInterval(getContacts, 1000);
    
        return () => {
            clearInterval(contactsInterval);
        };
    }, []);

    function addUser(username: string) {
        navigate("/canvas/" + username);
    }

    return (
        <Flex justify="center" align="center" vertical style={{width: "100%"}}>
            {addUserModalOpen && (
                <UserSelect onClose={() => setAddUserModalOpen(false)} onSelected={addUser}/>
            )}
            <Flex justify="left" align="center">
                <Button type="text" onClick={() => setAddUserModalOpen(true)}>
                    <UserAddOutlined style={{fontSize: 24}}/>
                </Button>
            </Flex> 

            <List
                dataSource={foundUsers}
                loading={loading}
                style={{ width: "95%" }}
                renderItem={(user) => (
                    <Link to={`/canvas/${user.username}`}>
                        <List.Item>
                            <List.Item.Meta
                                avatar={<Avatar src={`https://ui-avatars.com/api/?name=${user.username}`} />}
                                title={user.username}
                                description={(() => {
                                    console.log();
                                    switch (user.status) {
                                        case UserStatus.WAITING_CONTACT:
                                            return (
                                                <span><CaretRightFilled /> Delivered</span>
                                            );

                                        case UserStatus.WAITING_SELF:
                                            return (
                                                <span style={{ "color": "#ff0000", "fontWeight": "bold" }}><BuildOutlined /> Your Turn!</span>
                                            );
                                    }
                                })() }
                            />
                        </List.Item>
                    </Link>
                )}
            />
        </Flex>
    )
}