import { ChangeEvent, useEffect, useState } from "react";

import { Flex, List, Avatar, Button, ConfigProvider, Divider, Input, Typography } from "antd";
import { UserAddOutlined, CaretRightFilled, BuildOutlined, SearchOutlined } from "@ant-design/icons";

import { Link, useNavigate } from "react-router-dom";

import UserSelect from "../../components/FindUsers";
import { User, UserStatus } from "../../types/User";
import { apiPostRequest } from "../../network";

const { Search } = Input;

export default function Home() {
    const [foundUsers, setFoundUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [addUserModalOpen, setAddUserModalOpen] = useState<boolean>(false);
    const [searchOpen, setSearchOpen] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");

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

    const noFriendsFound = () => (
        <div style={{ textAlign: 'center' }}>
            <p>No friends found! Add someone to start a new canvas!</p>
        </div>
    );

    return (
        <Flex justify="center" align="center" vertical style={{width: "100%"}}>
            {addUserModalOpen && (
                <UserSelect onClose={() => setAddUserModalOpen(false)} onSelected={addUser}/>
            )}
            <Flex justify="space-between" align="center" style={{width: "95%", marginTop: 8}}>
                {searchOpen ? (
                    <Search style={{width: "50%", marginLeft: 15}} autoFocus 
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} 
                    onBlur={() => {
                        setSearchOpen(false);
                        setSearch("");
                    }} />
                ) : (
                    <Button shape="circle" onClick={() => setSearchOpen(true)} icon={
                        <SearchOutlined style={{fontSize: 24}}/>
                    } style={{width: 40, height: 40}} />
                )}
                <Typography style={{fontSize: 20}}>Canvases</Typography>
                <Button shape="circle" onClick={() => setAddUserModalOpen(true)} icon={
                    <UserAddOutlined style={{fontSize: 24}}/>
                } style={{width: 40, height: 40}} />
            </Flex> 

            <ConfigProvider renderEmpty={noFriendsFound}>
                <List
                    dataSource={foundUsers.filter(user => user.username.toLowerCase().includes(search.toLowerCase()))}
                    loading={loading}
                    style={{ width: "95%" }}
                    renderItem={(user) => (
                        <>
                            <Link to={`/canvas/${user.username}`}>
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Avatar src={`https://ui-avatars.com/api/?name=${user.username}`} />}
                                        title={user.username}
                                        description={(() => {
                                            switch (user.status) {
                                                case UserStatus.WAITING_CONTACT:
                                                    return (
                                                        <span><CaretRightFilled /> Delivered</span>
                                                    );

                                                case UserStatus.WAITING_SELF:
                                                    return (
                                                        <span style={{ "color": "#00cc00", "fontWeight": "bold" }}><BuildOutlined /> Your Turn!</span>
                                                    );
                                            }
                                        })() }
                                    />
                                </List.Item>
                            </Link>
                            <Divider style={{margin: 1}} />
                        </>
                    )}
                />
            </ConfigProvider>
        </Flex>
    )
}