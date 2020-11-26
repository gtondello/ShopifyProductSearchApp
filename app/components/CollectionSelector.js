/*
 * Demo Collection selector
 * (not being used currently)
 */
import { Fragment } from 'react';
import {
    Autocomplete,
    Icon,
    TextContainer,
    Stack,
    Tag
} from '@shopify/polaris';
import { SearchMinor } from '@shopify/polaris-icons';

/**
 * Props:
 * - collections: array
 * - label: string
 * - selectedOptions: array
 * - onChangeSelection: function(array)
 */
class CollectionSelector extends React.Component {
    constructor(props) {
        super(props);
        this.deselectedOptions = props.collections.map(collection => ({
            value: collection.id,
            label: collection.title
        }));
        this.state = {
            //selectedOptions: [],
            inputValue: '',
            options: this.deselectedOptions
        };
    }

    render() {
        const textField = (
            <Autocomplete.TextField
                onChange={this.updateText}
                label={this.props.label}
                value={this.state.inputValue}
                prefix={<Icon source={SearchMinor} color="inkLighter" />}
                placeholder="Search for Collections"
            />
        );
        return (
            <Fragment>
                <Autocomplete
                    allowMultiple
                    options={this.state.options}
                    selected={this.props.selectedOptions}
                    onSelect={this.updateSelection}
                    textField={textField}
                />
                {this.props.selectedOptions.length > 0 &&
                    <TextContainer>
                        <Stack vertical>
                            {this.props.selectedOptions.map((selectedOption) => {
                                const matchedOption = this.state.options.find((option) => {
                                    const match = option.value.match(selectedOption);
                                    return match[0];
                                });
                                return (
                                    <Tag key={selectedOption} onRemove={this.removeCollection}>{matchedOption.label}</Tag>
                                );
                            })}
                        </Stack>
                    </TextContainer>
                }
            </Fragment>
        );
    }

    updateText = (value) => {
        this.setState({ inputValue: value });

        if (value === '') {
            this.setState({ options: this.deselectedOptions });
            return;
        }

        const filterRegex = new RegExp(value, 'i');
        const resultOptions = this.deselectedOptions.filter((option) =>
            option.label.match(filterRegex),
        );
        this.setState({ options: resultOptions });
    };

    updateSelection = (selected) => {
        if (this.props.onChangeSelection) {
            this.props.onChangeSelection(selected);
        }
    };

    removeCollection = (selected) => {
        const options = [...this.props.selectedOptions];
        options.splice(options.indexOf(selected), 1);
        if (this.props.onChangeSelection) {
            this.props.onChangeSelection(options);
        }
    };
}

export default CollectionSelector;