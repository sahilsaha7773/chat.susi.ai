import React from 'react';
import _Button from '@material-ui/core/Button';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepButton from '@material-ui/core/StepButton';
import { Grid, Col, Row } from 'react-flexbox-grid';
import PropTypes from 'prop-types';
import Design from './BotBuilderPages/Design';
import Preview from './Preview/Preview';
import CircularProgress from '@material-ui/core/CircularProgress';
import CircularLoader from '../../shared/CircularLoader';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import uiActions from '../../../redux/actions/ui';
import Configure from './BotBuilderPages/Configure';
import Deploy from './BotBuilderPages/Deploy';
import _Paper from '@material-ui/core/Paper';
import _TextField from '@material-ui/core/TextField';
import _ChevronLeft from '@material-ui/icons/ChevronLeft';
import _ChevronRight from '@material-ui/icons/ChevronRight';
import getQueryStringValue from '../../../utils/getQueryStringValue';
import avatars from '../../../utils/avatars';
import { storeDraft, updateSkill, readDraft } from '../../../apis/index';
import createActions from '../../../redux/actions/create';
import SkillWizard from '../SkillCreator/SkillWizard';
import mobileView from '../../../utils/isMobileView';
import styled from 'styled-components';

const isMobile = mobileView();

const Home = styled.div`
  width: 100%;
  min-height: 100vh;

  @media (min-width: 769px) {
    padding: 40px 30px 30px;
  }
`;

const Container = styled.div`
  padding-top: 25px;
  padding-right: 15px;

  @media (max-width: 1200px) {
    padding-right: 0px;
  }
`;

const Button = styled(_Button)`
  margin-left: 10px;
`;

const Paper = styled(_Paper)`
  width: 100%;
  margin-top: 20px;
  position: relative;
  margin-right: 30px;
  padding: 15px 0px;

  @media (min-width: 769px) {
    padding: 15px;
  }
`;

const ChevronRight = styled(_ChevronRight)`
  position: absolute;
  left: 0;
  top: 0;
  width: 35px;
  height: 35px;
  color: rgb(158, 158, 158);
  cursor: pointer;
  display: inherit;
`;

const ChevronLeft = styled(_ChevronLeft)`
  position: absolute;
  left: 4px;
  top: 4px;
  width: 35px;
  height: 35px;
  color: white;
  cursor: pointer;
  display: inherit;
`;

const Content = styled.div`
  margin: 0 16px;

  @media (max-width: 1200px) {
    margin: 0px;
  }
`;

const StepperCol = styled(Col)`
  @media (max-width: 1200px) {
    position: inherit;
    margin-left: 0px;
    margin-bottom: 40px;
    margin-top: 30px;
  }
`;

const ContainerCol = styled(Col)`
  height: 88%;
  margin-top: 10px;
  position: sticky;
  margin-left: 0;
  top: 0px;
  @media (max-width: 1200px) {
    position: inherit;
    margin-left: 0px;
    margin-bottom: 40px;
  }
`;

const TextField = styled(_TextField)`
  width: 100%;
`;

const PreviewContainer = styled.div`
  position: relative;
  overflow: hidden;
  margin-top: 20px;
`;

const CenterHeading = styled.h2`
  text-align: center;
`;

const PreviewButton = styled.div`
  height: 45px;
  width: 42px;
  position: fixed;
  z-index: 1;
  top: 75px;
  right: 0;
  background-color: rgb(158, 158, 158);
  overflow-x: hidden;
  padding-top: 20px;
`;

const ContentContainer = styled.div`
  margin-bottom: 20px;
`;

const ActionContainer = styled.div`
  padding: 0px 15px;

  @media (max-width: 500px) {
    padding: 0px;
  }
`;

const DraftButtonContainer = styled.div`
  float: left;
  padding-top: 20px;

  @media (max-width: 480px) {
    width: 100%;
    padding-top: 0px;
    margin-bottom: 10px;
  }
`;

const ActionButtonContainer = styled.div`
  float: right;
  padding-left: 20px;
  padding-top: 20px;
  display: flex;
  flex-direction: row-reverse;

  @media (max-width: 480px) {
    float: left;
    margin-right: 10px;
    padding-left: 0px;
    padding-top: 0px;
    margin-bottom: 10px;
  }
`;

const BR = styled.br`
  @media (min-width: 769px) {
    display: none;
  }
`;

class BotWizard extends React.Component {
  componentDidMount() {
    const { actions } = this.props;
    if (
      getQueryStringValue('template') ||
      getQueryStringValue('draftID') ||
      (getQueryStringValue('name') &&
        getQueryStringValue('group') &&
        getQueryStringValue('language'))
    ) {
      if (getQueryStringValue('template')) {
        for (let template of this.props.templates) {
          if (template.id === getQueryStringValue('template')) {
            let { code } = template;
            // Update code
            actions
              .setSkillCode({ code })
              .then(() => {
                this.setState({
                  loaded: true,
                });
              })
              .catch(error => {
                console.log(error);
              });
          }
        }
      } else if (getQueryStringValue('draftID')) {
        let draftID = getQueryStringValue('draftID');
        this.getDraftBotDetails(draftID);
      } else {
        // editing a saved bot
        let name = getQueryStringValue('name');
        let group = getQueryStringValue('group');
        let language = getQueryStringValue('language');
        this.setState({
          commitMessage: `Updated Bot ${name}`,
          newBot: false,
        });
        this.getBotDetails(name, group, language);
      }
    } else {
      this.setState({
        loaded: true,
      });
    }
  }

  constructor(props) {
    super(props);
    let avatarsIcons = avatars.slice();
    this.state = {
      finished: false,
      stepIndex: 0,
      themeSettingsString: '{}',
      slideState: 1, // 1 means in middle, 2 means preview collapsed
      colBuild: 8,
      colPreview: 4,
      prevButton: 0, // 0 means disappear, 1 means appear
      savingSkill: false,
      savedSkillOld: {}, // contains skill meta data information for last saved skill
      updateSkillNow: false,
      imageChanged: false,
      loaded: false,
      commitMessage: '',
      image: avatarsIcons[1].url,
      newBot: true,
    };
  }

  componentWillUnmount() {
    const { actions } = this.props;
    actions.resetCreateStore();
  }

  saveDraft = () => {
    const {
      actions,
      category,
      language,
      name,
      buildCode,
      configCode,
    } = this.props;
    let { designCode, imageUrl: image } = this.props;
    designCode = designCode.replace(/#/g, '');
    if (image.search('images/') === -1) {
      image = 'images/' + image;
    }
    let skillData = {
      category,
      language,
      name,
      buildCode,
      designCode,
      configCode,
      image,
    };
    let object = JSON.stringify(skillData);
    if (skillData.category !== null) {
      storeDraft({ object })
        .then(payload => {
          actions.openSnackBar({
            snackBarMessage: 'Successfully saved draft of your chatbot.',
            snackBarDuration: 2000,
          });
        })
        .catch(error => {
          actions.openSnackBar({
            snackBarMessage: "Couldn't save the draft. Please try again.",
            snackBarDuration: 2000,
          });
        });
    } else {
      actions.openSnackBar({
        snackBarMessage: "Couldn't save the draft. Please select the Category",
        snackBarDuration: 2000,
      });
    }
  };

  getDraftBotDetails = id => {
    const { actions } = this.props;
    readDraft({ id })
      .then(payload => {})
      .catch(error => {
        actions.openSnackBar({
          snackBarMessage: "Couldn't get your drafts. Please reload the page.",
          snackBarDuration: 2000,
        });
      });
  };

  getBotDetails = (name, group, language) => {
    const { actions, imageUrl } = this.props;
    actions
      .getBotDetails({ group, language, skill: name, model: 'general' })
      .then(payload => {
        let savedSkillOld = {
          OldGroup: group,
          OldLanguage: language,
          OldSkill: name,
          oldImageName: imageUrl.replace('images/', ''),
        };
        this.setState({
          loaded: true,
          savedSkillOld,
          updateSkillNow: true,
        });
      })
      .catch(error => {
        this.setState({
          loaded: true,
        });
        actions.openSnackBar({
          snackBarMessage: "Error! Couldn't fetch skill",
          snackBarDuration: 2000,
        });
      });
  };

  handleNext = () => {
    const { stepIndex } = this.state;
    const { name } = this.props;
    this.setState({
      stepIndex: stepIndex + 1,
      finished: stepIndex >= 3,
      commitMessage: 'Created Bot ' + name,
    });
  };

  handlePrev = () => {
    const { stepIndex } = this.state;
    if (stepIndex > 0) {
      this.setState({ stepIndex: stepIndex - 1 });
    }
  };

  getStepContent(stepIndex) {
    switch (stepIndex) {
      case 0:
        return <SkillWizard />;
      case 1:
        return <Design />;
      case 2:
        return <Configure />;
      case 3:
        return <Deploy />;
      default:
    }
  }

  setStep = stepIndex => {
    const { actions, name } = this.props;
    if (stepIndex === 0) {
      actions.setView({ view: 'code' });
    }
    this.setState({
      stepIndex,
      commitMessage: 'Created Bot ' + name,
    });
  };

  handlePreviewToggle = () => {
    let { slideState } = this.state;
    if (slideState === 2) {
      this.setState({
        slideState: 1,
        colBuild: 8,
        colPreview: 4,
        prevButton: 0,
      });
    } else if (slideState === 1) {
      this.setState({
        slideState: 2,
        colBuild: 12,
        colPreview: 0,
        prevButton: 1,
      });
    }
  };

  handleCommitMessageChange = event => {
    this.setState({
      commitMessage: event.target.value,
    });
  };

  saveClick = () => {
    // save the skill on the server
    const {
      email,
      accessToken,
      configCode,
      designCode,
      imageUrl,
      name,
      file,
      category,
      language,
    } = this.props;
    let { buildCode } = this.props;
    const {
      updateSkillNow,
      savedSkillOld,
      commitMessage,
      imageChanged,
    } = this.state;
    buildCode = configCode + '\n' + designCode + '\n' + buildCode;
    buildCode = '::author_email ' + email + '\n' + buildCode;
    buildCode = '::protected Yes\n' + buildCode;
    if (!accessToken) {
      this.props.actions.openSnackBar({
        snackBarMessage: 'Please login and then try to create/edit a skill',
        snackBarPosition: { vertical: 'top', horizontal: 'right' },
        variant: 'warning',
      });
      return 0;
    }
    let skillName = name.trim().replace(/\s/g, '_');
    if (
      !new RegExp(/.+\.\w+/g).test(imageUrl) &&
      imageUrl !== 'images/<image_name>' &&
      imageUrl !== 'images/<image_name_event>' &&
      imageUrl !== 'images/<image_name_job>' &&
      imageUrl !== 'images/<image_name_contact>'
    ) {
      this.props.actions.openSnackBar({
        snackBarMessage: 'image must be in format of images/imageName.jpg',
        snackBarPosition: { vertical: 'top', horizontal: 'right' },
        variant: 'warning',
      });
      return 0;
    }
    if (skillName === '') {
      this.props.actions.openSnackBar({
        snackBarMessage: 'Bot name is not given',
        snackBarPosition: { vertical: 'top', horizontal: 'right' },
        variant: 'warning',
      });
      return 0;
    }
    if (category === '') {
      this.props.actions.openSnackBar({
        snackBarMessage: 'Category name is not given',
        snackBarPosition: { vertical: 'top', horizontal: 'right' },
        variant: 'warning',
      });
      return 0;
    }
    if (language === '') {
      this.props.actions.openSnackBar({
        snackBarMessage: 'Language name is not given',
        snackBarPosition: { vertical: 'top', horizontal: 'right' },
        variant: 'warning',
      });
      return 0;
    }

    this.setState({
      savingSkill: true,
    });

    let form = new FormData();
    if (updateSkillNow) {
      form.append('OldGroup', savedSkillOld.OldGroup);
      form.append('OldLanguage', savedSkillOld.OldLanguage);
      form.append('OldSkill', savedSkillOld.OldSkill);
      form.append('old_image_name', savedSkillOld.oldImageName);

      form.append('NewGroup', category);
      form.append('NewLanguage', language);
      form.append('NewSkill', name.trim().replace(/\s/g, '_'));

      form.append('changelog', commitMessage);
      form.append('imageChanged', imageChanged);
      form.append('new_image_name', imageUrl.replace('images/', ''));
      form.append('image_name_changed', imageChanged);
    } else {
      form.append('group', category);
      form.append('language', language);
      form.append('skill', name.trim().replace(/\s/g, '_'));
      form.append('image_name', imageUrl.replace('images/', ''));
    }
    if (file) {
      form.append('image', file);
    } else {
      form.append('image', '');
    }
    form.append('content', buildCode);
    form.append('access_token', accessToken);
    form.append('private', '1');

    updateSkill(form, updateSkillNow ? 'modifySkill.json' : 'createSkill.json')
      .then(data => {
        if (data.accepted === true) {
          let savedSkillOld = {
            OldGroup: category,
            OldLanguage: language,
            OldSkill: name.trim().replace(/\s/g, '_'),
            oldImageName: imageUrl.replace('images/', ''),
          };
          this.setState(
            {
              savingSkill: false,
              savedSkillOld,
              updateSkillNow: true,
              imageChanged: false,
            },
            () => this.handleNext(),
          );
          this.props.actions.openSnackBar({
            snackBarMessage: 'Your Bot has been saved',
            snackBarPosition: { vertical: 'top', horizontal: 'right' },
            variant: 'success',
          });
        } else {
          this.setState({
            savingSkill: false,
          });
          this.props.actions.openSnackBar({
            snackBarMessage: String(data.message),
            snackBarPosition: { vertical: 'top', horizontal: 'right' },
            variant: 'error',
          });
        }
      })
      .catch(error => {
        this.setState({
          savingSkill: false,
        });
        this.props.actions.openSnackBar({
          snackBarMessage: String(error),
          snackBarPosition: { vertical: 'top', horizontal: 'right' },
          variant: 'error',
        });
      });
  };

  check = () => {
    const { actions } = this.props;
    const { updateSkillNow } = this.state;
    if (updateSkillNow) {
      this.setStep(3);
    } else {
      actions.openSnackBar({
        snackBarMessage:
          'Please save the chatbot in Configure tab before deploying.',
        snackBarDuration: 2000,
      });
    }
  };

  render() {
    const {
      colBuild,
      loaded,
      commitMessage,
      stepIndex,
      savingSkill,
      updateSkillNow,
      prevButton,
      colPreview,
    } = this.state;

    return (
      <Home>
        <Grid fluid>
          <Row>
            <StepperCol
              md={12}
              xl={colBuild}
              style={{
                display: colBuild === 0 ? 'none' : 'block',
              }}
            >
              <Container>
                {!loaded ? (
                  <CircularLoader />
                ) : (
                  <div>
                    <Stepper
                      activeStep={stepIndex}
                      nonLinear
                      alternativeLabel={!!isMobile}
                    >
                      <Step>
                        <StepButton onClick={() => this.setStep(0)}>
                          Build
                        </StepButton>
                      </Step>
                      <Step>
                        <StepButton onClick={() => this.setStep(1)}>
                          Design
                        </StepButton>
                      </Step>
                      <Step>
                        <StepButton onClick={() => this.setStep(2)}>
                          Configure
                        </StepButton>
                      </Step>
                      <Step>
                        <StepButton onClick={() => this.check()}>
                          Deploy
                        </StepButton>
                      </Step>
                    </Stepper>
                    <Content>
                      <ContentContainer>
                        {this.getStepContent(stepIndex)}
                      </ContentContainer>
                    </Content>
                  </div>
                )}
              </Container>
              <ActionContainer
                style={{
                  display: stepIndex === 3 ? 'none' : 'block',
                }}
              >
                {stepIndex === 2 ? (
                  <TextField
                    label="Commit message"
                    placeholder="Enter Commit Message"
                    margin="normal"
                    value={commitMessage}
                    onChange={this.handleCommitMessageChange}
                  />
                ) : null}

                {stepIndex <= 2 ? (
                  <DraftButtonContainer>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={this.saveDraft}
                    >
                      Save Draft
                    </Button>
                  </DraftButtonContainer>
                ) : null}
                <ActionButtonContainer>
                  {stepIndex === 2 ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={this.saveClick}
                      style={{ minWidth: '11rem' }}
                    >
                      {// eslint-disable-next-line
                      savingSkill ? (
                        <CircularProgress color="inherit" size={24} />
                      ) : updateSkillNow ? (
                        'Update and Deploy'
                      ) : (
                        'Save and Deploy'
                      )}
                    </Button>
                  ) : null}
                  {stepIndex < 2 ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={this.handleNext}
                    >
                      Next
                    </Button>
                  ) : null}
                  {stepIndex !== 0 && stepIndex !== 3 ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={this.handlePrev}
                    >
                      Back
                    </Button>
                  ) : null}
                  {stepIndex === 0 ? (
                    <Link to="/mybots">
                      <Button variant="contained" color="primary">
                        Cancel
                      </Button>
                    </Link>
                  ) : null}
                </ActionButtonContainer>
              </ActionContainer>
            </StepperCol>
            {prevButton === 1 ? (
              <PreviewButton>
                <span title="See Preview">
                  <ChevronLeft onClick={this.handlePreviewToggle} />
                </span>
              </PreviewButton>
            ) : null}
            <ContainerCol
              md={12}
              xl={colPreview}
              style={{
                display: colPreview === 0 ? 'none' : 'block',
              }}
            >
              <Paper>
                <span title="collapse preview">
                  <ChevronRight onClick={this.handlePreviewToggle} />
                </span>
                <BR />
                <CenterHeading>Preview</CenterHeading>
                <PreviewContainer>
                  <Preview />
                </PreviewContainer>
              </Paper>
            </ContainerCol>
          </Row>
        </Grid>
      </Home>
    );
  }
}

BotWizard.propTypes = {
  templates: PropTypes.array,
  actions: PropTypes.object,
  accessToken: PropTypes.string,
  email: PropTypes.string,
  code: PropTypes.string,
  view: PropTypes.string,
  imageUrl: PropTypes.string,
  name: PropTypes.string,
  language: PropTypes.string,
  buildCode: PropTypes.string,
  configCode: PropTypes.string,
  designCode: PropTypes.string,
  category: PropTypes.string,
  file: PropTypes.object,
};

function mapStateToProps(store) {
  return {
    email: store.app.email,
    accessToken: store.app.accessToken,
    buildCode: store.create.skill.code,
    name: store.create.skill.name,
    category: store.create.skill.category,
    language: store.create.skill.language,
    imageUrl: store.create.skill.imageUrl,
    configCode: store.create.configCode,
    designCode: store.create.design.code,
    file: store.create.skill.file,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({ ...createActions, ...uiActions }, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(BotWizard);
