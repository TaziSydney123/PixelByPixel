import { ChangeEvent, useState } from "react";

import { Avatar, Button, List, Modal, Space } from "antd";
import Search from "antd/es/input/Search";
import { PlusOutlined } from "@ant-design/icons";
import { apiPostRequest } from "../network";

type UserSelectProps = {
    onSelected: (selected: string) => void,
    onClose: () => void,
};

export default function UserSelect(props: UserSelectProps) {
    const { onSelected, onClose } = props;

    const [foundUsers, setFoundUsers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const onSearch = (search: string) => {
        if (search) {
            setLoading(true);
            apiPostRequest("similarUsernames", { username: search })
            .then(res => res.json()).then(data => {
                setFoundUsers(data.usernames);
                setLoading(false);
            });
        } else {
            setFoundUsers([]);
        }
    }

    return (
        <Modal open onCancel={onClose} title="Add Friends" okButtonProps={{
            style: {
                display: "none",
                pointerEvents: "none"
            }
        }}>
            <Space direction="vertical" style={{width: "100%"}}>
                <Search placeholder="search for a user" onChange={(event: ChangeEvent<HTMLInputElement>) => onSearch(event.target.value)} />
                {foundUsers.length > 0 && (
                    <List
                        bordered
                        dataSource={foundUsers}
                        loading={loading}
                        style={{ width: "100%" }}
                        renderItem={(user) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar src={`https://ui-avatars.com/api/?name=${user}`} />}
                                    title={user}
                                />
                                <Button style={{paddingLeft: 8, paddingRight: 8}} 
                                    onClick={() => {
                                        onSelected(user);
                                        onClose();
                                    }}
                                >
                                    <PlusOutlined/>
                                </Button>
                            </List.Item>
                        )}
                    />
                )}
            </Space>
        </Modal>
    );
}