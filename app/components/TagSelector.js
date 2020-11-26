/*
 * Demo Tag selector
 * (not being used currently)
 */
import { Fragment } from 'react';
import {
    TextField,
    Button,
    Icon,
    TextContainer,
    Stack,
    Tag
} from '@shopify/polaris';
import { CirclePlusMinor } from '@shopify/polaris-icons';

/**
 * Props:
 * - tags: array
 * - label: string
 * - onChangeTags: function(array)
 */
class TagSelector extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            inputValue: ''
        };
    }
    render() {
        return (
            <Fragment>
                <TextField
                    onChange={this.updateText}
                    label={this.props.label}
                    value={this.state.inputValue}
                    placeholder="vintage, cotton, summer"
                    connectedRight={
                        <Button disabled={this.state.inputValue.trim() == ''} onClick={this.addTag}>
                            <Icon source={CirclePlusMinor} color="Indigo" />
                        </Button>
                    }
                />
                {this.props.tags.length > 0 &&
                    <TextContainer>
                        <Stack>
                            {this.props.tags.map((tag) => {
                                return (
                                    <Tag key={tag} onRemove={this.removeTag}>{tag}</Tag>
                                );
                            })}
                        </Stack>
                    </TextContainer>
                }
            </Fragment>
        );
    }

    updateText = (value) => {
        if (value.substring(value.length-1) == ',') {
            this.addTag();
        } else {
            this.setState({ inputValue: value });
        }
    }

    addTag = () => {
        const tag = this.state.inputValue.trim();
        if (tag != '') {
            const tags = [...this.props.tags];
            tags.push(tag);
            this.setState({ inputValue: '' });
            if (this.props.onChangeTags) {
                this.props.onChangeTags(tags);
            }
        }
    }

    removeTag = (tag) => {
        const tags = [...this.props.tags];
        tags.splice(tags.indexOf(tag), 1);
        if (this.props.onChangeTags) {
            this.props.onChangeTags(tags);
        }
    };
}

export default TagSelector;
